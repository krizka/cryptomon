// reducers/city.js
import { makeReducer, makeActions } from '../make-reducer';
// import rest from '../utils/fetch-with-log';

const initialState = {
};

const prefix = 'PAGE_';

const reducer = makeReducer(prefix, initialState, {
    SET_VAR({ name, value }) {
        return { [name]: { $set: value } };
    },

    RESET() {
        return { $set: initialState }
    },
});

const actions = makeActions(prefix, {
    SET_VAR: ['name', 'value'],
    RESET: [],
});
const keys = Object.keys(actions);


export default actions;
export { reducer, keys, actions };