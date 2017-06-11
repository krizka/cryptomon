/**
 * Created by kriz on 29/05/2017.
 */

import { tickerEmitter } from '/imports/toys/poloniex_ticker/pubs';
import { MarginOrder, MarginPosition, ORDER_STATE } from './order';
import { wrapPromise } from '../../utils/wrap-promise';
import { poloniexPrivateApi } from '../poloniex/api';

function parsePosition(newPosition) {
    return {
        amount: +newPosition.amount,
        basePrice : +newPosition.basePrice,
        lendingFees : +newPosition.lendingFees,
        liquidationPrice: newPosition.liquidationPrice = -1,
        pl: +newPosition.pl,
        total: +newPosition.total,
        type: newPosition.type,
    }
}

function updateMarginPosition(api, currencyPair) {
    const newPosition = api.getMarginPosition(currencyPair);
    let position = MarginPosition.findOne({ currencyPair });
    if (newPosition) {
        if (position) {
            Object.assign(position, parsePosition(newPosition));
        } else {
            position = new MarginPosition(parsePosition(newPosition));
        }
        position.save();
    } else if (position) {
        position.remove();
    }
}

export function runUpdateMarginOrder() {
    const { apiKey, apiSecret, userAgent = 'cryptomonitor 0.1' } = Meteor.settings.poloniex;

    tickerEmitter.on('trade', Meteor.bindEnvironment(updateOrderStates));

    function updateOrderStates(trade) {
        let currencyPair = trade.currencyPair;

        const placed = MarginOrder.find({
            currencyPair,
            state: ORDER_STATE.PLACED,
            $or: [{ orderType: 'buy', rate: { $gte: trade.rate }}, {orderType: 'sell', rate: { $lte: trade.rate }}]
        }).fetch();
        if (!placed.length)
            return;

        const api = poloniexPrivateApi(apiKey, apiSecret);
        const openOrders = api.returnOpenOrders({ currencyPair: currencyPair });
        placed.forEach(order => {
            const oo = openOrders.find(oo => oo.orderNumber === order.orderNumber);
            if (!oo) {
                order.state = ORDER_STATE.CLOSED;
                order.save();

                updateMarginPosition(api, currencyPair);
            }
        });
    }
}