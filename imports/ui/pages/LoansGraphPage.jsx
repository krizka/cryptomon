/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { LoansGraphWithData } from '../../toys/poloniex_loans/ui/LoansGraph';

export const LoansGraphPage = React.createClass({
    render() {
        const { params } = this.props;
        return (<LoansGraphWithData symbol={params.symbol}/>);
    }
});