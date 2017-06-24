/**
 * Created by kriz on 14/06/2017.
 */

export function retry(func, retries = 10) {
    while (retries--) {
        try {
            return func()
        } catch (e) {
            console.error('RETRY error', e.message);
        }
    }
}
