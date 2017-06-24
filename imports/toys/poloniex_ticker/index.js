/**
 * Created by kriz on 18/05/2017.
 */

import './methods';
import './pubs';
import { collectTrades } from './ideas/trades-volume';
// import { collectOrders } from './ideas/collect-orders';
import { startSignalBot } from './ideas/botsignal';

startSignalBot();

// [
//     { currencyPair: 'BTC_ETH', volume: 500},
//     { currencyPair: 'BTC_XRP', volume: 100},
//     { currencyPair: 'BTC_FCT', volume: 100},
//     { currencyPair: 'BTC_XMR', volume: 100},
//     { currencyPair: 'BTC_LTC', volume: 100},
//     { currencyPair: 'BTC_DASH', volume: 100},
//     { currencyPair: 'BTC_STR', volume: 100},
//     { currencyPair: 'BTC_DOGE', volume: 100},
//     { currencyPair: 'BTC_MAID', volume: 100},
//     { currencyPair: 'BTC_CLAM', volume: 100},
// ].forEach(cp =>
// collectOrders();
collectTrades(100);



