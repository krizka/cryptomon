/**
 * Created by kriz on 14/04/2017.
 */

import React from 'react';
import { AlertList, Alert, AlertContainer } from "react-bs-notifier";

export class Alerts extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            alerts: [],
        };
    }

    componentWillMount() {
        if (Alerts.instance)
            throw new Error('secondary Alerts component detected');
        Alerts.instance = this;
    }

    componentWillUnmount() {
        Alerts.instance = null;
    }

    static generate(headline, message, type = 'info') {
        Alerts.instance.generateAlert(headline, message, type);
    }

    generateAlert(headline, message, type = 'info') {
        const newAlert = {
            id: (new Date()).getTime(),
            type: type,
            headline,
            message
        };

        this.setState({
            alerts: [...this.state.alerts, newAlert]
        });
    }

    onAlertDismissed(alert) {
        const alerts = this.state.alerts;

        // find the index of the alert that was dismissed
        const idx = alerts.indexOf(alert);

        if (idx >= 0) {
            this.setState({
                // remove the alert from the array
                alerts: [...alerts.slice(0, idx), ...alerts.slice(idx + 1)]
            });
        }
    }

    clearAlerts() {
        this.setState({
            alerts: []
        });
    }

    render() {
        const { position = 'top-right', timeout, dismissTitle="Close" } = this.props;
        return (
            <AlertList
                position={position}
                alerts={this.state.alerts}
                timeout={timeout}
                dismissTitle={dismissTitle}
                onDismiss={this.onAlertDismissed.bind(this)}
            />
        );
    }
}
