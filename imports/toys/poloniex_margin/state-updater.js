/**
 * Created by kriz on 29/05/2017.
 */

import { tickerEmitter } from '../poloniex_ticker/pubs';
import { MarginOrder, MarginPosition, ORDER_STATE } from './order';
import { poloniexPrivateApi, getPrivateApi } from '../poloniex/api';
import { retry } from '../../utils/exceptions';


function parsePosition(newPosition) {
    return {
        currencyPair: newPosition.currencyPair,
        amount: +newPosition.amount,
        basePrice: +newPosition.basePrice,
        lendingFees: +newPosition.lendingFees,
        liquidationPrice: newPosition.liquidationPrice = -1,
        pl: +newPosition.pl,
        total: +newPosition.total,
        type: newPosition.type,
    }
}

export function updateMarginPosition(currencyPair = 'all') {
    api = getPrivateApi(false);
    const newPositions = retry(() => api.getMarginPosition(currencyPair));
    _.each(newPositions, (newPosition, currencyPair) => {
        newPosition.currencyPair = currencyPair;
        if (newPosition.type === 'none')
            newPosition = undefined;

        let position = MarginPosition.findOne({ currencyPair });
        if (newPosition) {
            let parsedPosition = parsePosition(newPosition);
            if (position) {
                Object.assign(position, parsedPosition);
            } else {
                position = new MarginPosition(parsedPosition);
            }
            position.save();
        } else if (position) {
            position.remove();
        }
    });
}

export function runUpdateMarginOrder() {
    tickerEmitter.on('trade', Meteor.bindEnvironment(updateOrderStates));

    function updateOrderStates(trade) {
        let currencyPair = trade.currencyPair;

        const placed = MarginOrder.find({
            currencyPair,
            state: ORDER_STATE.PLACED,
            $or: [{ orderType: 'buy', rate: { $gte: trade.rate } }, { orderType: 'sell', rate: { $lte: trade.rate } }]
        }).fetch();
        if (!placed.length)
            return;

        const api = getPrivateApi();
        const openOrders = api.penOrders(currencyPair);
        placed.forEach(order => {
            const oo = openOrders.find(oo => oo.orderNumber === order.orderNumber);
            if (!oo) {
                order.state = ORDER_STATE.CLOSED;
                order.save();

                updateMarginPosition(currencyPair);
            }
        });
    }
}