// reducers/index.js

// import { reducer as formReducer } from 'redux-form';
// import routes from './routes';
import { reducer as page } from './page';
import { makeActions } from '../make-reducer';


// ... other reducers

export default {
    page,
};

export const actions = makeActions('STORE_', {
    RESET: [],
});