/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { Col, Grid, Row, Table } from 'react-bootstrap';
import { composeWithTracker } from '../../../utils/komposer-utils';
import { merge, compose as kompose } from 'react-komposer';
import { PoloniexOrders, PoloniexTrades } from '../ticker-col';
import sumBy from 'lodash/sumby';
import { withState, compose } from 'recompose';
import t from 'tcomb-form';
import { fromAstronomy } from '../../../ui/utils/tcomb-astronomy';
import { ReactActions } from '../../../ui/utils/react-actions';
import { MarginOrderForm } from '../../poloniex_margin/order';

const Form = t.form.Form;

const OrderBookRow = withState('hover', 'setHover', false)(({ order, hover, setHover, actions }) => {
    return <tr
        key={order.rate}
        className={order.type === 'bid' ? 'success' : (order.type === 'ask' ? 'danger' : null)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
    >
        <td className="number">{order.rate}</td>
        <td className="number">{order.amount.toFixed(8)} ({(order.amount*order.rate).toFixed(8)})</td>
        {hover && <td className="book-row__actions">
            <button className="btn tiny" onClick={() => actions.makeOrder()}>+</button>
        </td>}
    </tr>
});

const MarginOrderFormType = fromAstronomy(MarginOrderForm);

export const OrdersBookTable = ({ orders, trades, actions }) => {
    const ordersTable = (
        <Table className="order" bordered striped condensed hover>
            <thead>
            <tr>
                <th>Rate</th>
                <th>Amount</th>
                <th>Do</th>
            </tr>
            </thead>
            <tbody>
            {_.map(orders, order =>
                <OrderBookRow key={order.rate} order={order} actions={actions.bind({ order })}/>)
            }
            </tbody>
        </Table>
    );

    const groupped = _.groupBy(trades, t => t.type);

    const tradesSum = (groupped.buy && groupped.sell && <Table className="order" bordered striped condensed hover>
        <thead>
        <tr>
            <th>Type</th>
            <th>Buy</th>
            <th>Sell</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>Count</td>
            <td className="success">{groupped.buy.length}</td>
            <td className="danger">{groupped.sell.length}</td>
        </tr>
        <tr>
            <td>Summ</td>
            <td className="success">{sumBy(groupped.buy, t => t.amount).toFixed(2)}</td>
            <td className="danger">{sumBy(groupped.sell, t => t.amount).toFixed(2)}</td>
        </tr>

        </tbody>
    </Table>);

    const tradesTable = (<Table className="order" bordered striped condensed hover>
        <thead>
        <tr>
            <th>Type</th>
            <th>Rate</th>
            <th>Amount</th>
        </tr>
        </thead>
        <tbody>
        {_.map(trades, trade => {
            return <tr
                key={trade.date}
                className={trade.type === 'buy' ? 'success' : 'danger'}
            >
                <td className="number">{trade.type}</td>
                <td className="number">{trade.rate}</td>
                <td className="number">{trade.amount.toFixed(8)} ({(trade.amount*trade.rate).toFixed(8)})</td>
            </tr>
        })}
        </tbody>
    </Table>);

    const marginOrderForm = (
        <Form
            value={actions.orderForm}
            {...MarginOrderFormType}
            onChange={val => actions.setOrderForm(val)}
        />
    );

    return (<Grid>
            <Row style={{ backgroundColor: 'white' }}>
                <Col md={4}>
                    {marginOrderForm}
                </Col>
                <Col md={4}>
                    {ordersTable}
                </Col>
                <Col md={4}>
                    {tradesSum}
                    {tradesTable}
                </Col>
            </Row>
        </Grid>
    );
};

function cluster(data, map, reduce) {
    const result = {};
    data.forEach(d => {
        const key = map(d);
        if (result[key])
            result[key].push(d);
        else
            result[key] = [d];
    });

    return _.map(result, (v, k) => reduce(v, k))
}

const foldOrders = (orders, n) => {
    if (!orders.length)
        return orders;

    const dig = Math.pow(10, n);
    const undig = 1 / dig;
    const round = num => (Math.floor(num * dig) / dig).toFixed(8);

    // const folded = orders.reduce((acc, order) => {
    //     const rate = round(order.rate);
    //     const last = _.last(acc);
    //     if (last && last.rate === rate)
    //         last.amount += order.amount;
    //     else
    //         acc.push({ ...order, rate });
    //     return acc;
    // }, []);
    const folded = cluster(orders,
        o => round(o.rate),
        c => ({ ...c[0], rate: round(c[0].rate), amount: sumBy(c, o => o.amount) })
    );

    const spreadIndex = folded.findIndex(f => f.type === 'bid');
    const result = folded.slice(Math.max(0, spreadIndex - 20), Math.min(folded.length - 1, spreadIndex + 20));
    const first = round(_.first(result).rate), last = round(_.last(result).rate);

    const r = [];
    for (let i = first * dig; i >= last * dig; i--) {
        const rate = (i / dig).toFixed(8);
        const f = folded.find(f => f.rate === rate);
        if (f)
            r.push(f);
        else
            r.push({
                rate,
                amount: 0,
                type: 'none'
            })
    }

    return r;
    //
    // return result;
};

function getOrders({ params: { currencyPair } }, onData) {
    const sub = Meteor.subscribe('poloniex.orders', currencyPair);
    if (sub.ready()) {
        const orders = PoloniexOrders.find({ currencyPair }, { sort: { rate: -1 } }).fetch();
        const fold = foldOrders(orders, 7);
        onData(null, {
            orders: fold
        });
    }
}

function getTrades({ params: { currencyPair } }, onData) {
    const sub = Meteor.subscribe('poloniex.trades', currencyPair, 60 * 10);
    if (sub.ready()) {
        const trades = PoloniexTrades.find({ currencyPair }, { sort: { date: -1 } }).fetch();
        onData(null, {
            trades
        });
    }
}

function orderActions({ params: { currencyPair } }, onData) {
    const actions = ReactActions.bind({
        currencyPair,
        orerForm: {},
        makeOrder() {
            Meteor.call('poloniex.margin.create', this.order);
        },
        setOrderForm(orderForm) {
            this.orderForm = orderForm;
        }
    });

    onData(null, { actions });
}


export const OrdersTableWithData = compose(
    kompose(orderActions),
    merge(
        composeWithTracker(getOrders),
        composeWithTracker(getTrades),
    ),
)(OrdersBookTable);
