/**
 * Created by kriz on 05/11/16.
 */

import { each, last, get } from 'lodash';
import { Class } from 'meteor/jagi:astronomy';
import { UserError } from './error';
import { options } from '../toys/poloniex_ticker/ideas/trades-volume';


function logError(err, res) {
    if (err)
        console.error(err);
}

//////////////////////
// menu items

const unicodeBars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '█'];

const TelegramUsers = new Meteor.Collection('telegram_users');

class Session {
    constructor(api, msg) {
        this.tid = msg.from.id;
        this.api = api;
        this.msg = msg;
    }

    reply(text, options) {
        return this.api.sendHtml(this.tid, text, options);
    }
}

let makeTradesInfo = (trades) => {
    const pair = trades.currencyPair;
    const t = trades.trades;
    const last = _.last(t.trades);
    const rate = last ? last.rate : '???';
    let total = t.volumeTotal;
    let limit = trades.limit;
    let percent = total / (trades.volume24 / (24*60));
    const bar = unicodeBars[Math.min(Math.floor(percent * 8), 7)];

    return `r: <code>${rate}</code>,`+
        ` v: <code>${total.toFixed(2)}</code> ${bar} (${(percent*100).toFixed(0)}%),`+
        ` l: <code>${limit}</code> <b>${pair}</b>`+
        `\n`;
};

const cb = {
    init(api) {
        api.cb = this;

        api.sendHtml = function (chat_id, text, options = {}) {
            return this.sendMessage({ chat_id, text, parse_mode: 'HTML', ...options }, logError);
        };

        api.sendAllUsers = (text) => {
            try {
                const users = TelegramUsers.find().fetch();
                users.forEach(u => {
                    api.sendHtml(u.tid, text);
                })
            } catch (e) {
                console.error(e.message);
            }
        };

        const msgs = {};
        each(this.msgs, (v, k) => {
            msgs[k.toLowerCase()] = v;
            //     msgs[i18n('en', k).toLowerCase()] = v;
            //     msgs[i18n('ru', k).toLowerCase()] = v;
        });
        this.msgs = msgs;
    },

    message(api, msg) {
        if (!msg) // sometimes its undefined, like on 'editMessage'
            return;

        const session = new Session( api, msg );

        let cmd;
        if (msg.entities && (cmd = _.findWhere(msg.entities, { type: 'bot_command' }))) {
            const command = msg.text.substr(cmd.offset + 1, cmd.length - 1);
            const params = msg.text.substr(cmd.offset + cmd.length + 1).split(' ');
            this.command(session, command, params);
        }
    },

    command(session, command, params) {
        const admMatch = /admin(\w+)/.exec(command);
        if (admMatch) {
            if (!api.user.isAdmin)
                throw new UserError('command_not_found');

            return this.admin[admMatch[1]](session, api.user, ...params);
        }

        let sys;
        if (sys = this.cmds[command])
            sys(session, ...params);
        else
            throw new UserError('command_not_found');
    },

    forward({ api, msg }) {
    },

    inlineQuery(api, query) {
    },
    inlineResult(api, msg) {
    },
    inlineCallbackQuery(api, msg) {
    },
    editedMessage(api, message) {
        console.log(message);
    },

    file(session, file) {
    },

    contact(api, msg,) {
    },

    cmds: {
        start(session) {
            TelegramUsers.upsert({ tid: session.tid }, { $set: { tid: session.tid } });
            session.reply('Hi, I will send some signals for you!');
        },

        stop(session) {
        },

        help({ api, msg }) {
        },

        interval(session, interval) {
            options.notifyInterval = +interval * 1000;
            session.reply(`interval set to ${interval} sec`);
        },

        limit(session, pair, limit) {
            if (!limit || !pair) {
                session.reply(`usage: /limit pair limit_btc`);
                return;
            }

            let pairData = options.data[pair];
            if (pairData) {
                pairData.limit = +limit;
                session.reply(`limit for ${pair} set to ${limit} BTC`)
            } else {
                session.reply(`pair ${pair} not found`)
            }
        },

        info(session, currencyPair) {
            let text = '';
            if (currencyPair) {
                if (!options.data[currencyPair])
                    return session.reply(`no pair ${currencyPair}`);
                text = makeTradesInfo(options.data[currencyPair]);
            } else {
                _.each(options.data, t => text += makeTradesInfo(t));
            }
            session.reply(text);
        },

        top(session) {
            let text = '';
            _.head(_.sortBy(options.data, t => -t.trades.volumeTotal), 10).forEach(
                t => text += makeTradesInfo(t)
            );
            session.reply(text);
        },

        topVol(session) {
            let text = '';
            _.head(_.sortBy(options.data, t => -t.trades.volumeTotal/t.volume24), 10).forEach(
                t => text += makeTradesInfo(t)
            );
            session.reply(text);
        },

        lang({ api, msg }) {
        },

        e({ api, msg }) {
        },

        tr({ api, msg }) {
        },

        p({ api, msg }, photo) {
        }
    },
    admin: {},
};

export default cb;
