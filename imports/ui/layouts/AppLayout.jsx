/**
 * Created by kriz on 10/06/16.
 */

import React from 'react';
// import { Alerts } from '../utils/Alerts';
import Helmet from 'react-helmet';
import { Navigation } from './Navigation';
import { Alerts } from '../utils/Alerts';
import Favico from '../utils/Favico';
// import { Sidebar } from '../utils/Sidebar';

// import { YandexMetrikaContainer } from '../containers/metrika.js';
// import Helmet from 'react-helmet';
// import { ModalPlacer } from '../ModalHandler';
// import { NavigationContainer } from '../containers/NavigationContainer';

const meta = [
    {name: 'viewport', content: 'width=device-width, initial-scale=1.0'}
];

export const AppLayout = ({ children, location }) => {
    const scripts = [];
    return (
        <div id="wrapper" className="toggled">
            <Favico />
            <Helmet meta={meta}/>
            <Alerts timeout={3000}/>
            {/*<Sidebar />*/}
            <Navigation />
            {/*<Helmet script={scripts}/>*/}
            {children}
            {/*<YandexMetrikaContainer />*/}
        </div>
    );
};
