/**
 * Created by kriz on 18/05/2017.
 */


export const CURRENCIES = [
    'BTC',
    'BTS',
    'CLAM',
    'DOGE',
    'DASH',
    'LTC',
    'MAID',
    'STR',
    'XMR',
    'XRP',
    'ETH',
    'FCT',
];

export const MARGIN_PAIRS = CURRENCIES.slice(1).map(c => `BTC_${c}`);