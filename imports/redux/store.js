/**
 * Created by kriz on 11/12/16.
 */

import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import reducers from './reducers';

const storageReducers = combineReducers(reducers);

export const store = createStore(
    storageReducers,
    window && window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
);
