import { Alerts } from './Alerts';


export function alertCallback(headline) {
    return (err, result) => {
        if (err) {
            Alerts.generate(headline, err.message, 'danger');
        } else {
            Alerts.generate(headline, 'OK', 'success');
        }
    }
}