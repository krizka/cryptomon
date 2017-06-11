/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { Link } from 'react-router';
import { CURRENCIES } from '/imports/crypto/currencies';
import { ButtonGroup, Col, Grid, Row } from 'react-bootstrap';
import { dirName } from '../../utils/dir-name';

export const GraphLayoutPage = ({ children, location }) => {
    const dirPath = dirName(location.pathname);
    return <Grid>
        <Row className="m-b-16">
            <Col md={12}>
                <ButtonGroup>
                    {CURRENCIES.map(c =>
                        <Link
                            key={c}
                            to={`${dirPath}/BTC_${c}`}
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