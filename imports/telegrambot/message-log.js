/**
 * Created by kriz on 06/11/16.
 */

export const MessageLog = new Meteor.Collection('message_log');
export const BotMessageLog = new Meteor.Collection('message_log_bot');

export function saveMessage(message) {
    MessageLog.insert(message);
}

export function saveReply(message) {
    BotMessageLog.insert(message);
}