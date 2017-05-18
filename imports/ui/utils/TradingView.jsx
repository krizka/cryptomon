/**
 * Created by kriz on 18/05/2017.
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import { compose } from 'react-komposer';


import { CURRENCIES } from '/imports/crypto/currencies';
import { checkLoading } from './check-loading';


const script = [
    { src: "/charting/charting_library.min.js", },
    // { src: "/charting/static/bundles/vendors.210b3b7511cac4a98109.js", },
    // { src: "/charting/static/bundles/library.5f9190dba877443caabd.js", },
];
const link = [
    {
        type: "text/css",
        href: "/charting/static/bundles/library.79e3f90d582b491b88e5d5752709fb0e.css",
        rel: "stylesheet"
    }
];

export const TradingViewGraph = React.createClass({
    componentDidMount() {
        checkLoading('TradingView', this.initGraph);
    },

    componentWillUnmount() {
        this.props.datafeed.stop();
    },

    componentDidUpdate() {
        this.initGraph();
    },

    initGraph() {
        const { datafeed, symbol } = this.props;
        // TradingView.onready(() => {
        this.widget = new window.TradingView.widget({
            // fullscreen: true,
            // autosize: true,
            width: '100%',
            height: '600px',
            symbol,
            interval: 15,
            container_id: "tv-library-container",
            //	BEWARE: no trailing slash is expected in feed URL
            datafeed,
            library_path: "/charting/",
            locale: "en",//getParameterByName('lang') || "en",
            //	Regression Trend-related functionality is not implemented yet, so it's hidden for a while
            drawings_access: { type: 'black', tools: [{ name: "Regression Trend" }] },
            disabled_features: ["use_localstorage_for_settings"],
            enabled_features: ["study_templates"],
            charts_storage_url: 'https://saveload.tradingview.com',
            charts_storage_api_version: "1.1",
            client_id: 'tradingview.com',
            user_id: 'public_user_id'
        });
        // });
    },

    render() {
        return (<div>
                <Helmet script={script} link={link}/>
                <div id="tv-library-container" className="chart-page">
                    <div className="tv-side-toolbar"/>
                    <div className="tv-side-panel"/>
                    <div className="tv-main-panel">
                        <div className="header-chart-panel">
                            <div className="right"/>
                            <div className="left"/>
                        </div>
                        <div id="chart-area"/>
                    </div>
                </div>
            </div>

        );
    }
});
