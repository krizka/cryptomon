/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { Link } from 'react-router';
import { CURRENCIES } from '/imports/crypto/currencies';
import { ButtonGroup, Col, Grid, Row } from 'react-bootstrap';

export const GraphLayoutPage = ({ children }) => {
    return <Grid>
        <Row className="m-b-16">
            <Col md={12}>
                <ButtonGroup>
                    {CURRENCIES.map(c =>
                        <Link
                            key={c}
                            to={`/loans/graph/${c}`}
                            className="btn btn-default"
                            activeClassName="btn-info"
                        >{c}</Link>)}
                </ButtonGroup>
            </Col>
        </Row>
        <Row>
            <Col md={12}>
                {children}
            </Col>
        </Row>
    </Grid>
};