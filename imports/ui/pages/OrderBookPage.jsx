/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { OrdersGraphWithData } from '../../toys/poloniex_orderbook/ui/OrdersGraph';

export const OrderBookPage = React.createClass({
    render() {
        const { params } = this.props;
        return (<OrdersGraphWithData symbol={params.symbol}/>);
    }
});