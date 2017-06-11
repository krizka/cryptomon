/**
 * Created by kriz on 29/05/2017.
 */


import requestNode from 'request';

const request = Meteor.wrapAsync(requestNode);
export default request;