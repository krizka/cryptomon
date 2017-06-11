/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { Col, Grid, Row, Table } from 'react-bootstrap';
import { composeWithTracker } from '../../../utils/komposer-utils';
import { PoloniexOrders } from '../ticker-col';

export const OrdersBookTable = ({ orders }) => {
    const table = (
        <Table className="order" bordered striped condensed hover>
            <thead>
            <tr>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
            </thead>
            <tbody>
            {_.map(orders, order => {
                return <tr
                    key={(order.rate * 100000000).toFixed(0)}
                    className={order.type === 'bid' ? 'success' : (order.type === 'ask' ? 'danger' : null)}
                >
                    <td className="number">{order.rate.toFixed(8)}</td>
                    <td className="number">{order.amount.toFixed(8)}</td>
                </tr>
            })}
            </tbody>
        </Table>
    );

    return (<Grid>
            <Row>
                <Col mdOffset={2} md={8} style={{ backgroundColor: 'white' }}>
                    {table}
                </Col>
            </Row>
        </Grid>
    );
};

const foldOrders = (orders, n) => {
    if (!orders.length)
        return orders;

    const dig = Math.pow(10, n);
    const undig = 1 / dig;
    const round = num => Math.floor(num * dig) / dig;

    const folded = orders.reduce((acc, order) => {
        const rate = round(order.rate);
        const last = _.last(acc);
        if (last && last.rate === rate)
            last.amount += order.amount;
        else
            acc.push({ ...order, rate });
        return acc;
    }, []);

    const spreadIndex = folded.findIndex(f => f.type === 'bid');
    const result = folded.slice(Math.max(0, spreadIndex - 20), Math.min(folded.length - 1, spreadIndex + 20));
    const first = round(_.first(result).rate), last = round(_.last(result).rate);

    const r = [];
    for (let i = first * dig; i >= last * dig; i--) {
        const rate = i / dig;
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
    const sub = Meteor.subscribe('poloniex.orders');
    if (sub.ready()) {
        const orders = PoloniexOrders.find({ currencyPair }, { sort: { rate: -1 } }).fetch();
        const fold = foldOrders(orders, 7);
        onData(null, {
            orders: fold
        });
    }
}
export const OrdersTableWithData = composeWithTracker(getOrders)(OrdersBookTable);
