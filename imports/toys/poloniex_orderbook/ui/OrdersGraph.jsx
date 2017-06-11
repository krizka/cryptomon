/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { compose, withProps } from 'recompose';
import d3 from 'd3';

import d3core from 'react-d3-core';
import d3basic  from 'react-d3-basic';
import { Brush, LineChart } from 'react-d3-components';


import {
    findPoloniexOrdersAfter, findPoloniexOrdersInterval, findPoloniexOrdersLast,
    PoloniexOrdersCol
} from '../orders-col';
import { TradingViewGraph } from '../../../ui/utils/TradingView';
import { CURRENCIES } from '/imports/crypto/currencies';
import { composeWithTracker } from '../../../utils/komposer-utils';
import { diffDate } from '../../../utils/date';

// export const OrdersGraph = ({ datafeed, symbol, loans }) => {
//     // const byCurrency = loans.loans;
//     return (<TradingViewGraph datafeed={datafeed} symbol={symbol}/>);
// };

const width = 800;

export const OrdersGraph = React.createClass({
    getInitialState: function () {
        return {};
    },

    drawGraph() {
        const { orders, symbol } = this.props;
        let pair = `BTC_${symbol}`;
        const bids = orders.map(o => ({ x: o.createdAt, y: o.orders[pair].bidsBTC }));
        const asks = orders.map(o => ({ x: o.createdAt, y: o.orders[pair].asksBTC }));
        const width = 700,
            height = 300,
            margins = { left: 0, right: 0, top: 0, bottom: 0 },
            title = "User sample",
            // chart series,
            // field: is what field your data want to be selected
            // name: the name of the field that display in legend
            // color: what color is the line
            chartSeries = [
                {
                    field: 'a',
                    name: 'BMI',
                    color: '#ff7f0e'
                }
            ],
            // your x accessor
            x = function (d) {
                return d.i;//d.index;
            }

        return <d3core.Chart
            title={title}
            width={width}
            height={height}
            margins={margins}
        >
            <d3basic.LineChart
                margins={margins}
                title={title}
                data={chartData}
                width={width}
                height={height}
                chartSeries={chartSeries}
                x={x}
            />
        </d3core.Chart>
    },

    _onChange() {
        console.log('brush', arguments);
    },

    render() {
        const { orders, symbol } = this.props;
        let pair = `BTC_${symbol}`;
        const bids = {
            label: 'Bids',
            values: orders.map(o => ({ x: o.createdAt, y: o.orders[pair].bidsBTC })),
        };
        const asks = {
            label: 'Asks',
            values: orders.map(o => ({ x: o.createdAt, y: o.orders[pair].asksBTC }))
        };
        const asksPerc = {
            label: 'Asks Perc',
            values: orders.map(o => ({ x: o.createdAt, y: ((o.orders[pair].asksPerc || 1) - 1) * 1000 }))
        };
        const bidsPerc = {
            label: 'Bids Perc',
            values: orders.map(o => ({ x: o.createdAt, y: ((o.orders[pair].bidsPerc || 1) - 1) * 1000 }))
        };
        const colors = {
            Bids: 'green',
            Asks: 'red',
            'Bids Perc': 'blue',
            'Asks Perc': 'yellow',
        };

        const now = new Date(), yesterday = diffDate(now, 0, 0, 0, -1);

        const xScale = d3.time.scale().domain([yesterday, now]).range([0, width - 70]);
        const colorScale = function (label) {
            return colors[label];
        };


        return <div>
            <LineChart
                data={[bids, asks, asksPerc, bidsPerc]}
                chartSeries={[{
                    field: 'y',
                    name: 'Bids',
                    color: 'red'
                }, {
                    field: 'y',
                    name: 'BMI',
                    color: 'green'
                }]}
                colorScale={colorScale}
                width={width}
                height={400}
                margin={{ top: 10, bottom: 50, left: 50, right: 20 }}
                xScale={xScale}
                xAxis={{ tickValues: xScale.ticks(d3.time.hour, 1), tickFormat: d3.time.format("%H") }}
            />
            <Brush
                width={width}
                height={50}
                margin={{ top: 0, bottom: 30, left: 50, right: 20 }}
                xScale={xScale}
                extent={[diffDate(now, 0, 0, 0, -1), now]}
                onChange={this._onChange}
                xAxis={{ tickValues: xScale.ticks(d3.time.hour, 1), tickFormat: d3.time.format("%H") }}
            />
            {/*{this.drawGraph()}*/}
        </div>;
    }
});

function getLastLoans(props, onData) {
    const sub = Meteor.subscribe('poloniex_orders/last');
    if (sub.ready()) {
        const loans = findPoloniexOrdersLast().fetch()[0];
        onData(null, {
            loans
        });
    }
}

const symbols = {};

const orderToValue = (order) => {
    return { x: order.createdAt, y: order.bid }
};


function reduceBars(start, bars, resolution) {
    const res = resolution * 60 * 1000;

    return _.reduce(bars, (result, bar) => {
        const last = _.last(result);
        if (!last || (bar.time - last.time > res)) {
            result.push({ ...bar });
        } else {
            Object.assign(last, {
                close: bar.close,
                low: Math.min(last.low, bar.low),
                high: Math.max(last.high, bar.high),
                volume: last.volume + bar.volume
            });
        }
        return result;
    }, start);
}


function getOrders(props, onData) {
    const d = new Date;
    d.setDate(d.getDate() - 1);
    d.setSeconds(0, 0);
    const sub = Meteor.subscribe('poloniex_orders/after', d);
    if (sub.ready()) {
        const orders = findPoloniexOrdersAfter(d).fetch();
        onData(null, { orders });
    }
}

export const OrdersGraphWithData = compose(
    // withProps(setDatafeed)
    composeWithTracker(getOrders)
)(OrdersGraph);