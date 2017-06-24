/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { Col, Grid, Row, Table } from 'react-bootstrap';
import { composeWithTracker } from '../../../utils/komposer-utils';
import { merge, compose as kompose } from 'react-komposer';
import { PoloniexOrders, PoloniexTrades } from '../../poloniex_ticker/ticker-col';
import sumBy from 'lodash/sumby';
import partition from 'lodash/partition';
import { withState, compose } from 'recompose';
import t from 'tcomb-form';
import { fromAstronomy } from '../../../ui/utils/tcomb-astronomy';
import { ReactActions } from '../../../ui/utils/react-actions';
import { MarginOrderForm as MarginOrderFormModel, MarginOrder, ORDER_STATE, MarginPosition } from '../order';
import { alertCallback } from '../../../ui/utils/show-alert';

const Form = t.form.Form;

const OrderBookRow = withState('hover', 'setHover', false)(({ order, hover, setHover, actions }) => {
    const selected = actions.d.selectedOrder;
    const total = order.amount * order.rate
    return <tr
        key={order.rate}
        className={order.type === 'bid' ? 'success' : (order.type === 'ask' ? 'danger' : null)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
    >
        <td className="number ob-rate">{order.rate}</td>
        <td className="number ob-amount">
            <span className="ob-amount-bar" style={{ width: Math.min(100, total) }}>&nbsp;</span>
            {order.amount.toFixed(8)} ({total.toFixed(8)})
        </td>
        {hover && <td className="book-row__actions">
            <button className="btn tiny" onClick={() => actions.makeOrder()}>+</button>
            {selected && (selected.state === ORDER_STATE.PLACED ?
                <button className="btn tiny" onClick={() => actions.moveSelectedOrder()}>&gt;</button> :
                <button className="btn tiny" onClick={() => actions.reverseOrder()}>r</button>)
            }
        </td>}
    </tr>
});

const OrderBook = ({ orders, actions }) => {
    return (<div>
        <button className="btn" onClick={() => actions.setOrderBookRound(actions.d.orderBookRound + 1)}>+</button>
        <button className="btn" onClick={() => actions.setOrderBookRound(actions.d.orderBookRound - 1)}>-</button>
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
    </div>);
};
const OrderBookWithData = composeWithTracker(getOrders)(OrderBook);


const OpenOrderRow = withState('hover', 'setHover', false)(({ order, hover, setHover, actions }) => {
    const selected = actions.d.selectedOrder && actions.d.selectedOrder._id === order._id;
    return <tr
        key={order._id}
        className={selected ? 'info' : order.type === 'buy' ? 'success' : 'danger'}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => actions.selectOrder()}
    >
        <td>{order.type}</td>
        <td className="number">{order.rate.toFixed(8)}</td>
        <td className="number">{order.stopLoss && order.stopLoss.toFixed(8)}</td>
        <td className="number">{order.amount.toFixed(8)} ({(order.amount * order.rate).toFixed(8)})</td>
        <td>{order.state}</td>
        <td>{order.simulation ? 'Y' : 'N'}</td>
        {hover && <td className="book-row__actions">
            <button className="btn tiny" onClick={() => actions.cancelOrder()}>x</button>
        </td>}
    </tr>
});

const ClosedOrderRow = withState('hover', 'setHover', false)(({ order, hover, setHover, actions }) => {
    const selected = actions.d.selectedOrder && actions.d.selectedOrder._id === order._id;

    return <tr
        key={order._id}
        className={selected ? 'info' : order.type === 'buy' ? 'success' : 'danger'}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => actions.selectOrder()}
    >
        <td>{order.type}</td>
        <td className="number">{order.rate.toFixed(8)}</td>
        <td className="number">{order.stopLoss && order.stopLoss.toFixed(8)}</td>
        <td className="number">{order.amount.toFixed(8)} ({(order.amount * order.rate).toFixed(8)})</td>
        <td>{order.state}</td>
        <td>{order.simulation ? 'Y' : 'N'}</td>
        {/*{hover && <td className="book-row__actions">*/}
        {/*<button className="btn tiny" onClick={() => actions.reverseOrder()}>x</button>*/}
        {/*</td>}*/}
    </tr>
});


const MarginOrderFormType = fromAstronomy(MarginOrderFormModel);
const MarginOrderForm = ({ actions }) => {
    return <Form
        value={actions.orderForm}
        {...MarginOrderFormType}
        onChange={val => actions.setOrderForm(val)}
    />
};

const TradesTable = ({ actions, trades }) => {
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


    return (<div>
        {tradesSum}
        <Table className="order" bordered striped condensed hover>
            <thead>
            <tr>
                <th>Type</th>
                <th>Rate</th>
                <th>Amount</th>
            </tr>
            </thead>
            <tbody>
            {_.map(trades, trade => {
                const total = trade.amount * trade.rate;
                return <tr
                    key={trade.date}
                    className={trade.type === 'buy' ? 'success' : 'danger'}
                >
                    <td className="tt-type">{trade.type}</td>
                    <td className="number tt-rate">{trade.rate}</td>
                    <td className="number tt-amount">
                        <span className="ob-amount-bar" style={{ width: Math.min(100, total * 10) }}>&nbsp;</span>
                        {trade.amount.toFixed(8)} ({(total).toFixed(8)})
                    </td>
                </tr>
            })}
            </tbody>
        </Table>
    </div>);

};
const TradesTableWithData = composeWithTracker(getTrades)(TradesTable);

const MarginPositionTable = ({ marginPosition, actions }) => {
    return (<Table className="order" bordered striped condensed hover>
        <thead>
        <tr>
            <th>Cur</th>
            <th>Type</th>
            <th>Base</th>
            <th>Total</th>
            <th>PL</th>
            <th>Do</th>

        </tr>
        </thead>
        <tbody>
        {_.map(marginPosition, pos => {
            const act = actions.bind({ position: pos });
            // className={pos.type === 'buy' ? 'success' : 'danger'}
            return <tr
                key={pos._id}
            >
                <td>{pos.currencyPair}</td>
                <td>{pos.type}</td>
                <td className="number">{pos.basePrice.toFixed(8)}</td>
                <td className="number">{pos.total.toFixed(8)}</td>
                <td className="number">{pos.pl.toFixed(8)}</td>
                <td>
                    <button className="btn tiny" onClick={() => act.closePosition()}>x</button>
                </td>
            </tr>
        })}
        </tbody>
    </Table>);
};

const MarginPositionTableWithData = composeWithTracker(getMarginPosition)(MarginPositionTable)

export const OrdersBookTable = ({ currencyPair, openOrders, closedOrders, trades, actions }) => {
    const selected = actions.d.selectedOrder;

    const openOrdersTable = (<Table className="order" bordered striped condensed hover>
        <thead>
        <tr>
            <th>Type</th>
            <th>Rate</th>
            <th>SL</th>
            <th>Amount</th>
            <th>State</th>
            <th>Sim</th>
            <th>Do</th>
        </tr>
        </thead>
        <tbody>
        {_.map(openOrders, order => (
            <OpenOrderRow key={order._id} order={order} actions={actions.bind({ order })}/>
        ))}
        </tbody>
    </Table>);

    const closedOrdersTable = (<Table className="order" bordered striped condensed hover>
        <thead>
        <tr>
            <th>Type</th>
            <th>Rate</th>
            <th>SL</th>
            <th>Amount</th>
            <th>State</th>
            <th>Sim</th>
            {/*<th>Do</th>*/}
        </tr>
        </thead>
        <tbody>
        {_.map(closedOrders, order => {
            return <ClosedOrderRow key={order._id} order={order} actions={actions.bind({ order })}/>
        })}
        </tbody>
    </Table>);

    const selectedOrder = (selected && <div>
        Selected order
        <Table>
            <tbody>
            <OpenOrderRow order={selected} actions={actions.bind({ order: selected })}/>
            </tbody>
        </Table>
    </div>);

    return (<Grid>
            <Row style={{ backgroundColor: 'white' }}>
                <Col md={4}>
                    <MarginOrderForm actions={actions}/>
                    {selectedOrder}
                    {openOrdersTable}
                    {closedOrdersTable}
                </Col>
                <Col md={4}>
                    <OrderBookWithData currencyPair={currencyPair} actions={actions} round={actions.d.orderBookRound} random={actions.random}/>
                </Col>
                <Col md={4}>
                    <MarginPositionTableWithData actions={actions}/>
                    <TradesTableWithData currencyPair={currencyPair} actions={actions}/>
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

    // n = Math.floor(Math.log10(1/orders[0].rate)+4);
    const dig = Math.pow(10, n);
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
    let first = _.first(result), last = _.last(result);
    if (!first || !last)
        return [];
    first = round(first.rate);
    last = round(last.rate);

    // if ((last - first) * dig > 40)
    //     last =

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

function getOrders({ currencyPair, actions, round }, onData) {
    const sub = Meteor.subscribe('poloniex.orders', currencyPair);
    if (sub.ready()) {
        const orders = PoloniexOrders.find({ currencyPair }, { sort: { rate: -1 } }).fetch();
        const fold = foldOrders(orders, round);
        onData(null, {
            orders: fold
        });
    }
}

function getOpenOrders({ params: { currencyPair } }, onData) {
    const sub = Meteor.subscribe('poloniex.margin.orders', currencyPair);
    if (sub.ready()) {
        const orders = MarginOrder.find({ currencyPair }, { sort: { createdAt: -1 } }).fetch();
        const [openOrders, closedOrders] = partition(orders, o => {
            return o.state === ORDER_STATE.PLACED || (o.state === ORDER_STATE.CLOSED && o.stopLoss);
        });
        onData(null, {
            openOrders,
            closedOrders
        });
    }
}

function getTrades({ currencyPair }, onData) {
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
        orderForm: {
            simulation: false,
            margin: true,
            amount: 0.1,
            stopLoss: 0.7,
        },
        d: {
            orderBookRound: 6,
        },
        makeOrder() {
            let order = this.order;
            let orderForm = this.orderForm;

            let rate = +order.rate;
            let amount = orderForm.amount / rate;
            const stopLoss = rate * (1 + orderForm.stopLoss / (order.type === 'bid' ? -100 : 100));
            Meteor.call('margin.order', {
                ...orderForm,
                currencyPair,
                type: order.type === 'bid' ? 'buy' : 'sell',
                amount,
                rate,
                stopLoss,
                margin: !!orderForm.margin,
            }, alertCallback('Order'));
        },

        cancelOrder() {
            Meteor.call('margin.cancel', this.order._id, (err, res) => {
                this.d.selectedOrder = null;
                this.update();
                alertCallback('Order cancel')(err, res)
            });
        },

        setOrderForm(orderForm) {
            this.orderForm = orderForm;
        },

        selectOrder() {
            this.d.selectedOrder = this.order;
            this.update();
        },

        moveSelectedOrder() {
            Meteor.call('margin.move',
                this.d.selectedOrder._id,
                this.order.rate,
                alertCallback('Order move'));
        },

        reverseOrder() {
            Meteor.call('margin.reverseOrder',
                this.d.selectedOrder._id,
                this.order.rate,
                alertCallback('Reverse order'));
        },

        setOrderBookRound(round) {
            this.d.orderBookRound = round;
            this.update();
        },

        closePosition() {
            Meteor.call('margin.closePosition', this.position.currencyPair,
                alertCallback('Margin close'));
        },


        update() {
            this.random = Random.id();
            onData(null, { actions, currencyPair });
        }
    });

    actions.update();
}

function getMarginPosition(props, onData) {
    const sub = Meteor.subscribe('poloniex.margin.position');
    if (sub.ready()) {
        const marginPosition = MarginPosition.find().fetch();
        onData(null, {
            marginPosition
        });
    }
}

export const OrdersTableWithData = compose(
    kompose(orderActions),
    composeWithTracker(getOpenOrders),
)(OrdersBookTable);
