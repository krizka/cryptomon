/**
 * Created by kriz on 29/05/2017.
 */

import React from 'react';
import { composeWithTracker } from '../../../utils/komposer-utils';
import { merge } from 'react-komposer';

import { compose } from 'recompose';

import { PoloniexMarginOrderCol, ORDER_STATE } from '../order';
import { Table } from 'react-bootstrap';
import { getSymbolTicker, getTicker } from '../../poloniex_ticker/ui/Ticker';

export const MarginOpenOrdersComponent = React.createClass({
    render() {
        const { orders, getTicker, currencyPair, onSelect } = this.props;
        return (
            <Table bordered striped condensed hover>
                <thead>
                <tr>
                    <td>Pair</td>
                    <td>Rate</td>
                    <td>Last</td>
                    {/*<td>Closer</td>*/}
                    <td>Amount (BTC)</td>
                    {/*<td>Stop Loss</td>*/}
                </tr>
                </thead>
                <tbody>
                {orders.map(o => (
                    <tr key={o._id} onClick={()=>onSelect(o)}>
                        <td>{o.currencyPair}</td>
                        <td>{o.rate}</td>
                        <td>{getTicker(o.currencyPair)}</td>
                        {/*<td>{o.closer.toFixed(8)}</td>*/}
                        <td>{o.amount}</td>
                        {/*<td>{o.stopLoss}</td>*/}
                    </tr>))}
                </tbody>
            </Table>
        );
    }
});

function getOpenOrders({ currencyPair }, onData) {
    const sub = Meteor.subscribe('poloniex.margin.open', currencyPair);
    const query = { state: ORDER_STATE.PLACED };
    if (currencyPair)
        query.currncyPair = currencyPair;

    if (sub.ready()) {
        const orders = PoloniexMarginOrderCol.find(query).fetch();
        onData(null, { orders });
    }
}

export const MarginOpenOrders = merge(
    composeWithTracker(getTicker),
    composeWithTracker(getOpenOrders),
)(MarginOpenOrdersComponent);
