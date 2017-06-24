import callbacks from '../../../telegrambot/callbacks';
import setupBot from '../../../telegrambot/setup';
import { tickerEmitter } from '../pubs';


export function startSignalBot() {
    const config = Meteor.settings.bot;
    let bot;
    if (config)
        bot = setupBot(config, callbacks);

    function signalAll(s) {
        let text = `<b>${s.currencyPair}</b> volume for last minute: `+
            `${s.volume.toFixed(2)}, `+
            `rate: ${s.rate}(${s.min}, ${s.max}, buy: ${(s.bs*100).toFixed(1)}\n`+
            `which is x<b>${s.factor.toFixed(1)}</b> more than 1m mean value (${s.volume24.toFixed(2)} BTC per day)`;
        bot.sendAllUsers(text);
    }

    tickerEmitter.on('volumeSignal', signalAll);

    return bot;
}
