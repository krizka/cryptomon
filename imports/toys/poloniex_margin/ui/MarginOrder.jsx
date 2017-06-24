/**
 * Created by kriz on 29/05/2017.
 */

import React from 'react';
import t from 'tcomb-form';
import { compose } from 'recompose';
import { fromAstronomy } from '../../../ui/utils/tcomb-astronomy';
import { MarginOrderChangeForm, MarginOrderForm, PoloniexOrderChangeForm } from '../order';
import { composeWithTracker } from '../../../utils/komposer-utils';
import { Alert, Button } from 'react-bootstrap';
import { Ticker } from '../../poloniex_ticker/ui/Ticker';
import { MarginOpenOrders } from './MarginOpenOrders';


const Form = t.form.Form;

console.log('test');
const MarginOrderType = fromAstronomy(MarginOrderForm, { orderType: 1, amount: 1, rateGap: 1, stopLoss: 1 });
MarginOrderType.options.config = {
    // horizontal: {
    //     md: [3, 9],
    //     sm: [6, 6]
    // }
};
// const MarginOrderChangeType = fromAstronomy(PoloniexOrderChangeForm, { rateGap: 1 });

export const MarginOrder = React.createClass({
    getInitialState() {
        const { order } = this.props;
        const defaultOrder = {
            orderType: 'buy',
            amount: 0.1,
            rateGap: 0.2,
            stopLoss: 1,
        };
        return {
            values: order || defaultOrder
        };
    },

    componentWillReceiveProps(newProps) {
        if (newProps.order)
            this.setState({ values: newProps.order });
    },

    onChange(values) {
        this.setState({ values });
    },

    makeOrder() {
        const values = this.refs.form.getValue();
        // if (!values)
        //     this.setState({ errors: 'Validation errors' });
        if (values)
            this.props.actions.makeOrder(values, this.props.order);
    },

    changeOrder() {
        const values = this.refs.form.getValue();
        // if (!values)
        //     this.setState({ errors: 'Validation errors' });
        if (values)
            this.props.actions.changeOrder(values, this.props.order);
    },

    closeOrder() {
        this.props.actions.closeOrder(this.props.order);
    },

    render() {
        const { result, currencyPair, actions, order } = this.props;
        let orderType = this.props.order ? 'change' : this.state.values.orderType;
        return (<div>
            <MarginOpenOrders onSelect={o => actions.onSelect(o)}/>
            <Ticker currencyPair={currencyPair}/>
            {order ?
                <div>
                    {/*<Form*/}
                        {/*ref="form"*/}
                        {/*onChange={this.onChange}*/}
                        {/*{...MarginOrderChangeType}*/}
                        {/*value={this.state.values}*/}
                    {/*/>*/}
                    {/*<Button onClick={this.closeOrder} bsStyle="danger">Cancel</Button>*/}
                    {/*<Button onClick={this.changeOrder} className="pull-right" disabled={!orderType}>{orderType || 'Select order type'}</Button>*/}
                </div>
                :
                <div>
                    <Form
                        ref="form"
                        onChange={this.onChange}
                        {...MarginOrderType}
                        value={this.state.values}
                    />
                    <Button onClick={this.makeOrder} disabled={!orderType}>{orderType || 'Select order type'}</Button>
                </div>}
            {result && <Alert bsStyle={result.success ? 'success' : 'danger'}>
                <strong>{result.message}</strong>
            </Alert>}

        </div>);
    },
});

function makeOrderActions({ currencyPair }, onData) {

    const onResult = (err, result) => {
        if (err)
            result = { success: 0, message: err.message };
        onData(null, { actions, result })
    };

    const actions = ReactActions.bind({
        makeOrder(orderForm, order) {
            const data = { ...orderForm, currencyPair, stopLoss };
            Meteor.call('margin.order', data, onResult);
        },

        changeOrder(changeForm, order) {
            Meteor.call('margin.changeOrder', order._id, changeForm, onResult)
        },

        closeOrder(order) {
            Meteor.call('margin.close', order._id);
        },

        onSelect(order) {
            onData(null, { actions, currencyPair: order.currencyPair, order });
        }
    });

    onData(null, { actions })
}

export const MarginOrderPlace = compose(
    composeWithTracker(makeOrderActions),
)(MarginOrder);