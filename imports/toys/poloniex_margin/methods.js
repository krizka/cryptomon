/**
 * Created by kriz on 18/05/2017.
 */
// import {
//     findPoloniexLoansAfter, findPoloniexLoansInterval, findPoloniexLoansLast,
// } from './loans-col';
import { MARGIN_ORDER_TYPE, MarginOrder, ORDER_STATE } from './order';
import { getTicker } from '../poloniex_ticker/push-ticker';
import { poloniexPrivateApi } from '../poloniex/api';

const { apiKey, apiSecret, userAgent = 'cryptomonitor 0.1' } = Meteor.settings.poloniex;

Meteor.methods({
    'margin.order'(orderForm) {
        // check(orderForm, MarginOrderForm);

        const lastTicker = getTicker(orderForm.currencyPair);
        if (!lastTicker)
            throw new Meteor.Error('ticker not yet ready');

        const order = new MarginOrder(orderForm);

        const api = poloniexPrivateApi(apiKey, apiSecret);

        let rate, closer;
        const lendingRate = 0.005;

        try {

            if (orderForm.orderType === MARGIN_ORDER_TYPE.BUY) {
                rate = lastTicker.lowestAsk * (1 - orderForm.rateGap / 100);
                // closer = rate * (1 - orderForm.stopLoss / 100);

                // result.resultingTrades[orderForm.currencyPair].rate = rate;

                const amount = orderForm.amount / rate;
                order.result = api.marginBuy(orderForm.currencyPair, rate, amount, {
                    lendingRate,
                });
                // rate *= 1.0015;
            } else if (orderForm.orderType === MARGIN_ORDER_TYPE.SELL) {
                rate = lastTicker.highestBid * (1 + orderForm.rateGap / 100);
                // closer = rate * (1 + orderForm.stopLoss / 100);

                // result.resultingTrades[orderForm.currencyPair].rate = rate;

                const amount = orderForm.amount / rate;
                order.result = api.marginSell(orderForm.currencyPair, rate, amount, {
                    lendingRate,
                });
                // rate *= 0.9985;
            }

            order.rate = rate;
            order.state = order.result.success ? ORDER_STATE.PLACED : ORDER_STATE.ERROR;
            // order.closer = closer;

            order.save();

            console.log(orderForm, order.result);

            return order.result;

        } catch (err) {
            throw new Meteor.Error(err.message);
        }
    },

    'margin.close'(orderId) {
        const order = MarginOrder.findOne(orderId);
        if (!order)
            throw new Meteor.Error('order not found');

        const api = poloniexPrivateApi(apiKey, apiSecret);
        const result = api.cancelOrder(order.result.orderNumber);
        if (result.success)
            order.state = ORDER_STATE.CANCELED;
        order.save();
    },

    'margin.changeOrder'(orderId, data) {
        const order = MarginOrder.findOne(orderId);
        if (!order)
            throw new Meteor.Error('order not found');

        const lastTicker = getTicker(order.currencyPair);
        const rate = order.orderType === 'buy'
            ? lastTicker.lowestAsk * (1 - data.rateGap / 100)
            : lastTicker.highestBid * (1 + data.rateGap / 100);

        if (rate !== order.rate) {
            const api = poloniexPrivateApi(apiKey, apiSecret);
            const result = api.moveOrder(order.orderNumber, rate);
            if (result.success) {
                order.rate = rate;
                order.rateGap = data.rateGap;
                order.save();
            }
        }
        console.log(data);
    }
});

Meteor.publish('poloniex.margin.open', function () {
    return MarginOrder.find({ state: ORDER_STATE.PLACED });
});