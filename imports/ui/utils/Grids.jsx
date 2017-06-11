/**
 * Created by kriz on 29/05/2017.
 */

import React from 'react';
import { Col, Grid, Row } from 'react-bootstrap';

export const OneRowGrid = ({children, width = 12, offset}) => (
    <Grid>
        <Row>
            <Col md={width} mdOffset={offset} >{children}</Col>
        </Row>
    </Grid>
);

