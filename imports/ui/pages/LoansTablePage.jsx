/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { LoansTableWithData } from '../../toys/poloniex_loans/ui/LoansTable';
import { Col, Grid, Row } from 'react-bootstrap';

export const LoansTablePage = React.createClass({
    render() {
        return (<Grid>
                <Row>
                    <Col md={12}>
                        <LoansTableWithData/>
                    </Col>
                </Row>
            </Grid>
        );
    }
});