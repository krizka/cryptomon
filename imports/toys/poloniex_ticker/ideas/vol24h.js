/**
 * Created by kriz on 14/06/2017.
 */

import { getPublicApi } from '../../poloniex/api';

let volumes = volumes;

function updateVol24h() {
    const api = getPublicApi();
    const volumes = api.volume24();
}