/**
 * Created by kriz on 08/05/2017.
 */

import React from 'react';
// import { Tree, TreeSidebar } from '../Tree';
import { PagesTreeSidebar } from '../components/PagesTree';


export const Sidebar = ({children}) => {
    return (<div id="sidebar-wrapper">
        <ul className="sidebar-nav">
            {children}
        </ul>
    </div>        );

};

// export const Sidebar = React.createClass({
//     render() {
//         return (
//             <Sidebar>
//                     <li className="sidebar-brand">
//                         <a href="#">
//                             Treenity
//                         </a>
//                     </li>
//         </Sidebar>);
//     }
// });