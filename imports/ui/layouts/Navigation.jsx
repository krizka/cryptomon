/**
 * Created by kriz on 19/04/2017.
 */

import React from 'react';
import { Grid, MenuItem, Nav, Navbar, NavDropdown, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link, withRouter } from 'react-router';
import { merge } from 'react-komposer';
import { composeWithTracker } from '../../utils/komposer-utils';

const emulateClick = ()=>document.dispatchEvent(new MouseEvent('click'));
const NavLink = ({ to, href, children }) => (
    <LinkContainer to={to || href}><NavItem>{children}</NavItem></LinkContainer>);
const MenuLink = ({ to, href, children }) => (
    <LinkContainer to={to || href}><MenuItem eventKey={to} onSelect={emulateClick}>{children}</MenuItem></LinkContainer>);

export const Navigation = ({ loggedIn }) => {
    return (
        <Navbar inverse collapseOnSelect>
            <Navbar.Header>
                <Navbar.Brand>
                    <img src="/logo_cm512.png" /> <Link to="/">CryptoMonitor</Link>
                </Navbar.Brand>
                <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
                <Nav>
                    <NavLink href="/loans/graph">Poloniex Loans</NavLink>
                </Nav>
                <Nav pullRight>
                    {loggedIn ?
                        <NavItem href="#">Logout</NavItem>
                        :
                        <NavItem href="#">Login</NavItem>
                    }
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};
