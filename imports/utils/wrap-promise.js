/**
 * Created by kriz on 16/11/16.
 */

import Fiber from 'fibers';

export function wrapPromise(promise) {
    const fiber = Fiber.current;
    let error;
    promise
        .then(res => fiber.run(res))
        .catch(err => {error = err; fiber.run()});
    const res = Fiber.yield();
    if (error)
        throw error;
    return res;
}

export function wrapPromiseCall(promiseFunc, context) {
    return Meteor.wrapAsync(function(...args) {
        const cb = args.pop();
        const promise = promiseFunc.apply(context, args);
        promise.then(res => cb(null, res), err => cb(err))
    });
}
