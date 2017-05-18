/**
 * Created by kriz on 01/08/16.
 */

import update from 'immutability-helper';
import { combineReducers } from 'redux';

import each from 'lodash/each';
import isEmpty from 'lodash/isEmpty';

export function makeReducer(prefix, initialState, funcs) {
    const nested = {}, actionFuncs = {};

    each(funcs, (func, key) => {
        if (key.match(/^[a-z]/)) {
            nested[key] = func;
        } else {
            actionFuncs[prefix + key] = func;
        }
    });

    const combined = !isEmpty(nested) && combineReducers(nested);

    function reducer(state = initialState, action) {
        const func = actionFuncs[action.type];
        const newState = func ? // first - try to apply our function
            update(state, func(action, state)) :
            state;

        if (combined) { // if we have subreducers - call it too
            const inner = combined(state, action);
            if (inner !== newState) // and if something updated - ok, update it in state
                return {
                  ...state,
                  ...inner
                }
        }

        return newState;
    }

    return reducer;
}

export function makeActions(prefix, actions) {
    const result = {};
    each(actions, (params, type) => {
        result[type] = typeof params === 'function' ?
            function (...args) {
                return function (dispatch, getState) {
                    return params(...args, dispatch, getState);
                }
            }
            :
            function () {
                const action = { type: prefix + type };
                //noinspection FallThroughInSwitchStatementJS
                switch (params.length) {
                    case 8: action[params[7]] = arguments[7];
                    case 7: action[params[6]] = arguments[6];
                    case 6: action[params[5]] = arguments[5];
                    case 5: action[params[4]] = arguments[4];
                    case 4: action[params[3]] = arguments[3];
                    case 3: action[params[2]] = arguments[2];
                    case 2: action[params[1]] = arguments[1];
                    case 1: action[params[0]] = arguments[0];
                }
                return action;
            };
    });
    return result;
}

