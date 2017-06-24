import { getPrivateApi } from '../../poloniex/api.js';
import { TradesVolume } from './trades-volume';
import { MarginOrder, ORDER_STATE } from '../../poloniex_margin/order';
import { retry } from '../../../utils/exceptions';
import { satoshi } from '../margin-closer';


const base = 0.0049;

export class Alpha {
    constructor({ currencyPair, throttle = 5000, frame }) {
        this.api = getPrivateApi(false);
        this.currencyPair = currencyPair;
        this.throttle = throttle;
        // this.ordersThrottle = _.throttle(tick => this.updateOrders(tick), throttle);
        this.order = undefined;
        this.tv = new TradesVolume();
        this.frame = frame;
        this.last = 0;
        this.actualizeOpenOrders();
    }

    onTick(tick) {
        let now = Date.now();
        if (now - this.last < this.throttle)
            return;

        this.last = now + 9999999999;
        this.updateOrders(tick);
        this.last = Date.now();
    }


    onTrade(trade) {
        this.tv.addTrade(trade);

        if (!this.order)
            return;

        let rate = this.order.rate.toFixed(8);
        const type = this.order.type;

        if (this.order && ((type === 'buy' && trade.rate <= rate) || (type === 'sell' && trade.rate >= rate))) {
            if (!this.actualizeOpenOrders()) {
                if (type === 'buy' && trade.rate <= rate) {
                    console.log('catched on buy', trade.rate);
                    const rate = this.lastTick.lowestAsk * (1+base);
                    const type = 'sell';
                    if (!this.createOrder(rate, type) && !this.actualizeOpenOrders())
                        return;

                    this.sellinStart = Date.now();
                } else if (type === 'sell' && trade.rate >= rate) {
                    console.log('catched on sell', trade.rate);
                    if (this.order) {
                        this.order.remove();
                        this.order = undefined;
                    }
                }
            }
        }
    }

    updateOrders(tick) {
        this.lastTick = tick;
        let rate = tick.highestBid * (1-base);
        if (!this.order ) {
            const type = 'buy';
            if (!this.createOrder(rate, type))
                return;
        }
        const gap = (tick.lowestAsk - tick.highestBid)/tick.lowestAsk;
        if (this.order.type === 'buy') {// just thrailing this orer
            if (gap > base*2) {
                // this.order.moveOrder(+tick.highestBid * 0.9985);
                rate = +tick.highestBid + satoshi;
                console.log('moving', rate);
                this.order.moveOrder(rate);
            } else {
                const win = Math.abs(this.order.rate - tick.highestBid) / tick.highestBid;
                if (win > (base + 0.0002) || win < (base - 0.0002)) {
                    // rate = rate * ((win - base) / 2 + 1);
                    console.log('moving', rate, win);
                    this.order.moveOrder(rate);
                }
            }
        } else { // selling what we got
            if (gap > base*2) {
                // this.order.moveOrder(+tick.lowestAsk * 1.0015);
                rate = +tick.lowestAsk - satoshi;
                console.log('moving', rate);
                this.order.moveOrder(rate);
            } /*else {
                rate = +tick.lowestAsk * (1+base);
                console.log('moving', rate);
                this.order.moveOrder(rate);
            }*/
            else {
                let sellTimeout = 2 * 60000;
                const newRate = tick.lowestAsk * ((Date.now() - this.sellinStart) - sellTimeout) / sellTimeout;

                console.log('moving 2', rate, window);
                this.order.moveOrder(newRate);
            }
        }

    }

    createOrder(rate, type) {
        console.log('creating order', type, rate);
        const amount = 0.1 / rate;

        rate = +rate.toFixed(8);
        this.order = new MarginOrder({
            currencyPair: this.currencyPair,
            type: type,
            amount: amount,
            rate,
            createdAt: Date.now(),
            simulation: false,
            margin: true,
            internal: true,
            // stopLoss,
        });
        this.order.makeOrder();
        if (this.order.state !== ORDER_STATE.PLACED) {
            return this.actualizeOpenOrders();
        }

        return true;
    }

    actualizeOpenOrders() {
        if (!this.order) {
            this.order = new MarginOrder();
        }

        const open = retry(() => this.api.openOrders(this.currencyPair));
        if (open.length > 1) {
            open.forEach(o => retry(() =>
                this.api.cancelOrder(o.orderNumber)), 5);
        } else if (open.length === 1) {
            const o = open[0];
            if (!this.order)
                this.order = new MarginOrder();

            Object.assign(this.order, {
                ...o,
                currencyPair: this.currencyPair,
                amount: +o.amount,
                rate: +o.rate,
                createdAt: new Date(o.date + ' UTC'),
                simulation: false,
                state: ORDER_STATE.PLACED,
                result: { success: 1, orderNumber: o.orderNumber },
                margin: true,
                internal: true,
            });
            this.order.save();
        } else {
            this.order.remove();
            this.order = undefined;
            return false;
        }
        return true;
    }
}
