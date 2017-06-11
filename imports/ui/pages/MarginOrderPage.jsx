/**
 * Created by kriz on 29/05/2017.
 */

import React from 'react';
import { OneRowGrid } from '../utils/Grids';
import { MarginOrderPlace } from '../../toys/poloniex_margin/ui/MarginOrder';

export const MarginOrderPage = React.createClass({
    render() {
        return (<OneRowGrid width={6} offset={3}>
            <MarginOrderPlace currencyPair={this.props.params.currencyPair} />
        </OneRowGrid>);
    }
});