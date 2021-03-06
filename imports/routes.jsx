/**
 * Created by kriz on 10/06/16.
 */

import React from 'react';
import { IndexRoute, IndexRedirect, Route } from 'react-router';
import ReactHelmet from 'react-helmet';
import { Provider } from 'react-redux';

// import { store } from '/imports/redux/store';

// import ReactCookie from 'react-cookie';
import { ReactRouterSSR } from 'meteor/reactrouter:react-router-ssr';
import { AppLayout } from './ui/layouts/AppLayout';
import { LoansTablePage } from './ui/pages/LoansTablePage';
import { LinksPage } from './ui/pages/LinksPage';
import favico from './ui/utils/Favico';
import { LoansGraphPage } from './ui/pages/LoansGraphPage';
import { OrderBookPage } from './ui/pages/OrderBookPage';
import { GraphLayoutPage } from './ui/pages/GraphLayoutPage';
import { MarginOrderPage } from './ui/pages/MarginOrderPage';
import { OrdersTableWithData } from './toys/poloniex_margin/ui/OrdersTable';

const AppRoutes = (
    <Route path="/" component={AppLayout}>
        <IndexRoute component={LinksPage}/>
        <Route path="loans">
            <Route path="table" component={LoansTablePage}/>

            <Route path="graph" component={GraphLayoutPage}>
                <IndexRedirect to="BTC"/>
                <Route path=":symbol" component={LoansGraphPage}/>
            </Route>
        </Route>
        <Route path="orders" component={GraphLayoutPage}>
            <IndexRedirect to="BTC"/>
            <Route path="table/:currencyPair" component={OrdersTableWithData} />
            <Route path=":currencyPair" component={OrderBookPage}/>
        </Route>
        <Route path="margin" component={GraphLayoutPage}>
            <IndexRedirect to="BTC_BTS"/>
            <Route path=":currencyPair" component={OrdersTableWithData}/>
        </Route>
    </Route>
);

const Root = (children) => {
    return (
        <Provider store={store}>
            {children}
        </Provider>
    );
};


ReactRouterSSR.Run(AppRoutes, {
    props: {
        onUpdate() {
        }
    },
    // wrapperHook: Root,
}, {
    preRender: function (req, res) {

        // ReactCookie.plugToRequest(req, res);
    },
    htmlHook(html) {
        const head = ReactHelmet.rewind();
        return html.replace('<head>', '<head>' + favico + head.title + head.base + head.meta + head.link + head.script);
    },
    disableSSR: true,
});
