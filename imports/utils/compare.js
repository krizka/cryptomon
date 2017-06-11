/**
 * Created by kriz on 04/06/2017.
 */

import isEqualWith from 'lodash/isEqualWith';

export const compare = (val, to) => isEqualWith(val, to, (v, t) => (v === undefined || v === t ));