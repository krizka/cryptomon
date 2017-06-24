/**
 * Created by kriz on 13/06/2017.
 */

export const ReactActions = {
    bind(props) {
        props.__proto__ = this;
        return props;
    }
};
