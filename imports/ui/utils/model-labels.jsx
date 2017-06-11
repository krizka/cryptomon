/**
 * Created by kriz on 21/04/2017.
 */

import React from 'react';

export function label(name, help) {
    return <span className="form-label">{name} {help && <span className="label-help">{help}</span>}</span>
}
export function legend(name, help) {
    return <span className="form-legend">{name} {help && <span className="label-help">{help}</span>}</span>
}


