/**
 * Created by kriz on 29/05/2017.
 */

import React from 'react';
import { Button, ButtonGroup, Col, Row } from 'react-bootstrap';

export const TcombInputButtons = ({ onChange, value, attrs, config, label }) => {
    const change = evt => {
        onChange(evt.currentTarget.value);
    };

    return <div className="form-group form-group-depth-3 form-group-actions-0-text">
        <Row><Col md={12}>
            <label htmlFor={attrs.id} className="control-label">{label}</label>
        </Col></Row>
        <Row>
            <Col md={3}>
                <input className="form-control" {...attrs} onChange={change} value={value}/>
            </Col>
            <Col md={9}>
                <ButtonGroup>
                    {config.options.map(o =>
                        <Button
                            key={o.value}
                            bsStyle={o.value == value ? 'info' : 'default'}
                            onClick={() => change({ currentTarget: o })}
                        >{o.text}</Button>)}
                </ButtonGroup>
            </Col>
        </Row>
    </div>
};
