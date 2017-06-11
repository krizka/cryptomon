/**
 * Created by kriz on 29/05/2017.
 */

import { tickerEmitter } from '/imports/toys/poloniex_ticker/pubs';
import { MarginOrder } from './order';
import { wrapPromise } from '../../utils/wrap-promise';
import { poloniexPrivateApi } from '../poloniex/api';


export function runMarginCloser() {
    const { apiKey, apiSecret, userAgent = 'cryptomonitor 0.1' } = Meteor.settings.poloniex;

    // tickerEmitter.on('any', Meteor.bindEnvironment(updateOrderStates));

    function updateOrderStates(ticker) {
        const orders = MarginOrder.find({ pair: ticker.currencyPair, closeResult: { $exists: false } }).fetch();
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            if (order.orderType === 'buy') {
                if (ticker.highestBid < order.closer) {
                    if (!order.closeResult) {
                        const api = poloniexPrivateApi(apiKey, apiSecret);
                        const result = api.closeMarginPosition({ currencyPair: order.pair });
                        order.closeResult = result;
                        order.save();
                    }
                } else {
                    const closer = ticker.last * (1 - order.stopLoss / 100);
                    if (closer > order.closer) {
                        order.closer = closer;
                        order.save();
                    }
                }
            } else if (order.orderType === 'sell') {
                if (ticker.lowestAsk > order.closer) {
                    if (!order.closeResult) {
                        const api = poloniexPrivateApi(apiKey, apiSecret);
                        const result = api.closeMarginPosition({ currencyPair: order.pair });
                        order.closeResult = result;
                        order.save();
                    }
                } else {
                    const closer = ticker.last * (1 + order.stopLoss / 100);
                    if (closer < order.closer) {
                        order.closer = closer;
                        order.save();
                    }
                }
            }
        }
    }
}