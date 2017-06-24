/**
 * Created by kriz on 06/11/16.
 */

export function inlineKeyboard(...rows) {
    return {
        reply_markup: { inline_keyboard: rows }
    }
}

export function keyboard(...rows) {
    return {
        reply_markup: { keyboard: rows, resize_keyboard: true }
    }
}

export const hideKeyboard = {
    reply_markup: { hide_keyboard: true }
};

export const emptyMarkup = {
    reply_markup: ''
};