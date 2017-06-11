/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { Col, Grid, Row } from 'react-bootstrap';
import { Link } from 'react-router';

export const LinksPage = React.createClass({
    render() {
        return (<Grid>
                <Row>
                    <Col md={12}>
                        <table>
                            <tbody>
                            <tr>
                                <td>
                                    <Link to="/orders">Poloniex Orders Graph</Link>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Link to="/loans/graph">Poloniex Loans Graphs</Link>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Link to="/loans/table">Poloniex Loans Table</Link>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </Col>
                </Row>
            </Grid>
        );
    }
});