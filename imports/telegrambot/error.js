/**
 * Created by kriz on 06/11/16.
 */

// error that can be sent to user
export class UserError extends Error {
    constructor(...params) {
        super(...params);
        this.name = UserError.name;
    }
}
UserError.name = 'UserError';
