/**
 * Created by kriz on 05/11/16.
 */
import TelegramBot from 'telegram-bot-api';
import { UserError } from './error';
import { saveMessage, saveReply } from './message-log';

// function extract(from, object) {
//     const extr = {};
//     for (let field in object) {
//         const map = object[field];
//         const res = typeof map === 'function' ?
//             map(from[field], from) :
//             typeof map === 'string' ?
//                 from[map] :
//                 from[field];
//         if (res !== undefined)
//             extr[field] = res;
//     }
// }

export default function setupBot(config, callbacks) {
    const api = new TelegramBot(config);
    api.token = config.token;

    function on(event, cb) {
        if (!cb)
            throw new Error(`no callback for ${event}`);

        function checked_cb(msg, ...args) {
            try {
                return cb.call(callbacks, api, msg, ...args);
            } catch (error) {
                if (error.name === UserError.name)
                    return api.sendMessage({ chat_id: msg.from.id, text: error.message });
                else
                    console.error(`error in ${event} callback`, error.stack);
            }
        }

        api.on(event, Meteor.bindEnvironment(checked_cb));
    }

    api.on('update', Meteor.bindEnvironment(saveMessage));
    on('message', callbacks.message);
    on('inline.query', callbacks.inlineQuery);
    on('inline.result', callbacks.inlineResult);
    on('inline.callback.query', callbacks.inlineCallbackQuery);
    on('edited.message', callbacks.editedMessage);

    const exclude = { getUpdates: 1 };
    // meteorify all the api methods
    for (let prop in api) {
        if (api.hasOwnProperty(prop) && typeof api[prop] === 'function' && !exclude[prop])
            api[prop] = Meteor.wrapAsync(api[prop], api);
    }

    init(api);

    if (callbacks.init)
        callbacks.init(api);

    return api;
}

const methods = {
    sendMessage (params, cb) {
        Meteor.bindEnvironment(saveReply)(params);

        if (params.reply_markup && typeof params.reply_markup !== 'string') {
            params = {
                ...params,
                reply_markup: JSON.stringify(params.reply_markup),
            }
        }

        return this.sendMessageOrig(params, cb);
    },
};

function init(api) {
    api.sendMessageOrig = api.sendMessage;
    api.me = api.getMe();
    Object.assign(api, methods);
}