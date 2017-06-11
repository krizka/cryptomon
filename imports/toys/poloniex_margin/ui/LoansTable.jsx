/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { Col, Grid, Row, Table } from 'react-bootstrap';
import { composeWithTracker } from '../../../utils/komposer-utils';
import { findPoloniexLoansLast, PoloniexLoansCol } from '../loans-col';

export const LoansTable = ({ loans }) => {
    const byCurrency = loans.cur;
    const table = (
        <Table bordered striped condensed hover >
            <thead>
            <tr>
                <th>Currency</th>
                <th>Total</th>
                <th>Min Rate</th>
                <th>Min Rate Amount</th>
            </tr>
            </thead>
            <tbody>
            {_.map(byCurrency, (l, currency) => (
                <tr key={currency}>
                    <td><i className={`cc ${currency}`} /> {currency}</td>
                    <td className="number">{l.offers.total.toFixed(4)}</td>
                    <td className="number">{(l.offers.min.rate * 100).toFixed(4)} %</td>
                    <td className="number">{l.offers.min.amount.toFixed(4)}</td>
                </tr>
            ))}
            </tbody>
        </Table>
    );

    return (<Grid>
            <Row className="m-b-16">
                <Col md={12}>
                    <b>Last update: </b> {loans.createdAt.toString()}
                </Col>
            </Row>
            <Row>
                <Col mdOffset={2} md={8} style={{backgroundColor: 'white'}}>
                    {table}
                </Col>
            </Row>
        </Grid>
    );
};

function getLastLoans(props, onData) {
    const sub = Meteor.subscribe('poloniex_loans/last');
    if (sub.ready()) {
        const loans = findPoloniexLoansLast().fetch()[0];
        onData(null, {
            loans
        });
    }
}
export const LoansTableWithData = composeWithTracker(getLastLoans)(LoansTable);