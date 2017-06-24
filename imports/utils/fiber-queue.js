

export class FiberQueue {
    constructor() {
        this._queue = [];
        this._fiber = new Fiber(() => this._get());
    }
}