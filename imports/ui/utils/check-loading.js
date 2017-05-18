/**
 * Created by kriz on 18/05/2017.
 */


export function checkLoading(symbol, callback) {
    if (!window[symbol]) {
        setTimeout(checkLoading, 100, symbol, callback);
    } else {
        callback();
    }

}
