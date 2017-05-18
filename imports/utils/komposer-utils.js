/**
 * Created by kriz on 25/11/16.
 */

import { Tracker } from 'meteor/tracker';
import { compose } from 'react-komposer';

export function getTrackerLoader(reactiveMapper) {
    return (props, onData, env) => {
        let trackerCleanup = null;
        const handler = Tracker.nonreactive(() => Tracker.autorun(() => {
            // assign the custom clean-up function.
            trackerCleanup = reactiveMapper(props, onData, env);
        }));

        return () => {
            if (typeof trackerCleanup === 'function') trackerCleanup();
            return handler.stop();
        };
    };
}

export const composeWithTracker = (reactiveMapper, options) => compose(getTrackerLoader(reactiveMapper), options);

export function getPromiseLoader(promise) {
    return (props, onData) => {
        promise.then(data => onData(null, data), err => onData(err));
    };
}

export const composeWithPromise = (reactiveMapper, options) => compose(getPromiseLoader(reactiveMapper), options);

