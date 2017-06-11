/**
 * Created by kriz on 29/05/2017.
 */

import t from 'tcomb-form';
import React from 'react';

import { Class, Enum } from 'meteor/jagi:astronomy';
import { MARGIN_PAIRS } from '../../crypto/currencies';
import { label } from '/imports/ui/utils/model-labels';
import { TcombInputButtons } from '../../ui/utils/TcombButtonInput';

export const MARGIN_ORDER_TYPE = Enum.create({
    name: 'margin.orderType',
    identifiers: {
        SELL: 'sell',
        BUY: 'buy',
    }
});

export const ORDER_STATE = Enum.create({
    name: 'margin.orderType',
    identifiers: {
        CANCELED: 'canceled',
        PLACED: 'placed',
        CLOSED: 'closed',
        ERROR: 'error',
    }
});



const stringNumberTransformer = {
    format(num) {
        return num && +num;
    },
    parse(str) {
        return +str;
    }
};

export const MarginOrderForm = Class.create({
    name: 'margin.order.form',
    fields: {
        orderType: {
            type: String,
            form: {
                factory: t.form.Radio,
                options: [
                    { text: label('Buy', 'on growign market'), value: 'buy' },
                    { text: label('Sell', 'on falling market '), value: 'sell' }
                ]
            }
        },
        currencyPair: {
            type: String,
            form: {
                factory: t.form.Select,
                options: MARGIN_PAIRS.map(p => ({ text: p, value: p }))
            }
        },
        amount: {
            type: Number,
            form: {
                label: label('Amount', 'in BTC'),
                template: TcombInputButtons,
                config: {
                    options: [
                        { text: '0.1', value: 0.1 },
                        { text: '0.2', value: 0.2 },
                        { text: '0.3', value: 0.3 },
                        { text: '0.4', value: 0.4 },
                    ]
                },
            }
        },
        rateGap: {
            type: Number,
            form: {
                template: TcombInputButtons,
                config: {
                    options: [
                        { text: '0.1%', value: 0.1 },
                        { text: '0.2%', value: 0.2 },
                        { text: '0.3%', value: 0.3 },
                        { text: '0.4%', value: 0.4 },
                        { text: '0.5%', value: 0.5 },
                    ]
                },
            }
        }, // percent
        // takeProfit: { type: Number, }, // stop loss percents
    }

});

export const PoloniexOrderChangeForm = Class.create({
    name: 'margin.orderUpdateForm',
    fields: {
        rateGap: {
            type: Number,
            form: {
                template: TcombInputButtons,
                config: {
                    options: [
                        { text: '0.1%', value: 0.1 },
                        { text: '0.2%', value: 0.2 },
                        { text: '0.3%', value: 0.3 },
                        { text: '0.4%', value: 0.4 },
                        { text: '0.5%', value: 0.5 },
                    ]
                },
            }
        }, // percent
    }
});

export const PoloniexMarginOrderCol = new Meteor.Collection('polo_margin_order');

export const MarginOrder = MarginOrderForm.inherit({
    name: 'margin.order',
    collection: PoloniexMarginOrderCol,
    fields: {
        rate: { type: Number }, // price we want to buy,
        result: { type: Object }, // order placement result
        state: { type: ORDER_STATE },
    }
});

export const PoloniexMarginPositionCol = new Meteor.Collection('polo_margin_position');

export const MarginStopHelper = Class.create({
    name: 'margin.stopHelper',
    fields: {
        closer: { type: Number }, // price we want to buy,
        stopLoss: {
            type: Number,
            form: {
                template: TcombInputButtons,
                config: {
                    options: [
                        { text: '0.5%', value: 0.5 },
                        { text: '1.0%', value: 1.0 },
                        { text: '1.5%', value: 1.5 },
                        { text: '2.0%', value: 2.0 },
                    ]
                },
            }
        }, // stop loss percents
    }
});

export const MarginPosition = Class.create({
    name: 'margin.position',
    collection: PoloniexMarginPositionCol,
    fields: {
        amount: { type: Number, },
        basePrice: { type: Number, },
        lendingFees: { type: Number, },
        liquidationPrice: { type: Number, },
        pl: { type: Number, },
        total: { type: Number, },
        type: { type: String, },
        closeResult: { type: Object, optional: true, },
    }
});