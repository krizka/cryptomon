/**
 * Created by kriz on 18/05/2017.
 */
import React from 'react';
import { Helmet } from 'react-helmet';

const link = [
    { rel: "apple-touch-icon", sizes: "57x57", href: "/ico/apple-icon-57x57.png", },
    { rel: "apple-touch-icon", sizes: "60x60", href: "/ico/apple-icon-60x60.png", },
    { rel: "apple-touch-icon", sizes: "72x72", href: "/ico/apple-icon-72x72.png", },
    { rel: "apple-touch-icon", sizes: "76x76", href: "/ico/apple-icon-76x76.png", },
    { rel: "apple-touch-icon", sizes: "114x114", href: "/ico/apple-icon-114x114.png", },
    { rel: "apple-touch-icon", sizes: "120x120", href: "/ico/apple-icon-120x120.png", },
    { rel: "apple-touch-icon", sizes: "144x144", href: "/ico/apple-icon-144x144.png", },
    { rel: "apple-touch-icon", sizes: "152x152", href: "/ico/apple-icon-152x152.png", },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/ico/apple-icon-180x180.png", },
    { rel: "icon", type: "image/png", sizes: "192x192", href: "/ico/android-icon-192x192.png", },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "/ico/favicon-32x32.png", },
    { rel: "icon", type: "image/png", sizes: "96x96", href: "/ico/favicon-96x96.png", },
    { rel: "icon", type: "image/png", sizes: "16x16", href: "/ico/favicon-16x16.png", },
    { rel: "manifest", href: "/ico/manifest.json", },
];
const meta = [
    { name: "msapplication-TileColor", content: "#ffffff", },
    { name: "msapplication-TileImage", content: "/ico/ms-icon-144x144.png", },
    { name: "theme-color", content: "#ffffff", },
];

const Favico = () => (
    <Helmet link={link} meta={meta}/>
);

export default Favico;