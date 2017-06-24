/**
 * Created by kriz on 03/06/2017.
 */

import { createPrivateApi, PublicApi, Constant } from '@you21979/poloniex.com';
import { wrapPromiseCall } from '../../utils/wrap-promise';
import moment from 'moment';

function createMockApi() {
    function formatDate() {
        return moment().utc().format('YYYY-MM-DD hh:mm:ss');
    }
    function orderNumber() {
        return Random._randomString(10, '0123456789');
    }

    const api = {
        orders: [],

        marginBuy(currencyPair, rate, amount, { loanRate }) {
            let amountStr = amount.toFixed(8);
            const result = {
                "success": 1,
                "message": "Margin order placed.",
                "orderNumber": orderNumber(),
                "resultingTrades": {
                    [currencyPair]: [{
                        "amount": amountStr,
                        "date": moment().utc().format('YYYY-MM-DD hh:mm:ss'),
                        "total": amountStr,
                        "tradeID": "1213556",
                        "type": 'buy'
                    }]
                }
            };

            return result;
        },

        marginSell(currencyPair, rate, amount, { loanRate }) {
            let amountStr = amount.toFixed(8);
            const result = {
                "success": 1,
                "message": "Margin order placed.",
                "orderNumber": orderNumber(),
                "resultingTrades": {
                    [currencyPair]: [{
                        "amount": amountStr,
                        "date": formatDate(),
                        "total": amountStr,
                        "tradeID": "1213556",
                        "type": 'sell'
                    }]
                }
            };

            return result;
        },

        buy(currencyPair, rate, amount,) {
            let amountStr = amount.toFixed(8);
            const result = {
                "success": 1,
                "message": "Order placed.",
                "orderNumber": orderNumber(),
                "resultingTrades": {
                    [currencyPair]: [{
                        "amount": amountStr,
                        "date": formatDate(),
                        "total": amountStr,
                        "tradeID": "1213556",
                        "type": 'buy'
                    }]
                }
            };
            return result;
        },

        sell(currencyPair, rate, amount,) {
            let amountStr = amount.toFixed(8);
            const result = {
                "success": 1,
                "message": "Order placed.",
                "orderNumber": orderNumber(),
                "resultingTrades": {
                    [currencyPair]: [{
                        "amount": amountStr,
                        "date": formatDate(),
                        "total": amountStr,
                        "tradeID": "1213556",
                        "type": 'sell'
                    }]
                }
            };
            return result;
        },

        getMarginPosition(currencyPair) {
            return {
                "amount": "40.94717831",
                "total": "-0.09671314",
                "basePrice": "0.00236190",
                "liquidationPrice": -1,
                "pl": "-0.00058655",
                "lendingFees": "-0.00000038",
                "type": "long"
            }
        },

        closeMarginPosition({ currencyPair }) {
            const result = {
                "success": 1,
                "message": "Successfully closed margin position.",
                "resultingTrades": {
                    [currencyPair]: [{
                        "amount": "7.09215901",
                        "date": formatDate(),
                        "rate": "0.00235337",
                        "total": "0.01669047",
                        "tradeID": "1213346",
                        "type": "sell"
                    }, {
                        "amount": "24.00289920",
                        "date": formatDate(),
                        "rate": "0.00235321",
                        "total": "0.05648386",
                        "tradeID": "1213347",
                        "type": "sell"
                    }]
                }
            };
            return result;
        },

        cancelOrder(orderNumber) {
            return { success: 1 };
        },

        moveOrder(orderNumber, rate) {
            return { success: 1, orderNumber };
        },

        openOrders(currencyPair) {
            return [];
        }

    };
    return api;
}

let realPrivateApi;

export function poloniexPrivateApi(apiKey, apiSecret) {
    if (!apiKey) {
        console.warn('key is not defined, using mock api');
        return createMockApi();
    } else {
        if (realPrivateApi)
            return realPrivateApi;

        const api = createPrivateApi(apiKey, apiSecret);


        api.incrementNonce = function() {
            return this.nonce = Date.now();
        };
        const origQuery = api.query;
        api.query = function () {
            console.log('nonce', this.nonce);
            return origQuery.apply(this, arguments);
        };

        // make it meteorish
        [
            'buy',
            'sell',
            'marginBuy',
            'marginSell',
            'cancelOrder',
            'openOrders',
            'moveOrder',
            'closeMarginPosition',
            'getMarginPosition',
            'tradeHistory',
        ].forEach(name => {
            if (typeof api[name] === 'function') {
                const method = api[name];
                api[name] = wrapPromiseCall(function () {
                    const result = method.apply(api, arguments).catch(e => {
                        if (e.statusCode === 422) {
                            let match = e.message.match(/Nonce.*than (\d+)/);
                            if (match) {
                                api.nonce = Math.max(api.nonce, +match[1] + 1);
                            }
                            throw e;
                        } else
                            throw e;
                    });
                    return result;
                }, api);
            }
        });

        realPrivateApi = api;
        return api;
    }
}

export function getPrivateApi(test = true) {
    if (test)
        return poloniexPrivateApi();
    else {
        const { apiKey, apiSecret, userAgent = 'cryptomonitor 0.1' } = Meteor.settings.poloniex;
        return poloniexPrivateApi(apiKey, apiSecret, userAgent);
    }
}

export function getPublicApi() {
    if (!PublicApi._wrapped) {
        Constant.OPT_TIMEOUT_SEC = 60;
        [
            'volume24',
            'orderBook',
            'tradeHistory',
            'chartData',
            'currencies',
            'loanOrders',
        ].forEach(method => {
            PublicApi[method] = wrapPromiseCall(PublicApi[method], PublicApi);
        });

        PublicApi._wrapped = true;
    }

    return PublicApi;
}