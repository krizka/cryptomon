/**
 * Created by kriz on 05/12/16.
 */

import t from 'tcomb-form';
import each from 'lodash/each';
import { Class, Enum } from 'meteor/jagi:astronomy';
import zip from 'lodash/zip';
import get from 'lodash/get';


const exclude = {
    _id: 1,
    _t: 1,
    createdAt: 1,
    updatedAt: 1,
};

function convertOptions(field) {
    if (field.form)
        return field.form;
    return {};
}

function convertType(type) {
    switch (type) {
        case String: return t.String;
        case Number: return t.Number;
        case Boolean: return t.Boolean;
        case Object: return t.Object;
        case Date: return t.Date;
    }
}

function convertUnion(field) {
    const fieldType = field.type;
    const [types, options] = zip(...fieldType.children.map(type => convertField({ type })));

    const union = t.union(types);
    union.getTcombFormOptions = fieldType.getFormOptions;
    union.dispatch = function(data) {
        const index = data ? fieldType.children.findIndex(t => t.className === data.type) : -1;
        return types[~index ? index : 0];
    };
    return [union, options];//{ item: options }];
}

function convertField(field, fields) {
    const fieldType = field.type;
    const options = convertOptions(field);
    if (fieldType.prototype instanceof Class) {
        if (fieldType.children.length && options && options.union) {
            return convertUnion(field);
        }

        const tc = {};
        const opts = {fields: {}, ...fieldType.form};
        const convField = f => {
            const [type, opt] = convertField(f);
            if (!opt.hidden) {
                tc[f.name] = type;
                opts.fields[f.name] = opt || convertOptions(f);
            }
        };

        // save fields order from fields param
        if (fields) {
            each(fields, (v, name) => {
                let field = fieldType.definition.fields[name];
                if (field)
                    convField(field)
            });
        } else {
            each(fieldType.definition.fields, f => {
                if (exclude[f.name] || (fields && !fields[f.name]))
                    return;
                convField(f);
            });
        }

        const struct = t.struct(tc);
        struct.getTcombFormOptions = fieldType.getFormOptions;
        return [struct, opts];
    }
    let def = convertType(fieldType);
    if (def) {
        if (field.optional)
            def = t.maybe(def);
        return [def, options];
    }

    if (fieldType instanceof Array) {
        const [elType, itemOpt] = convertField({ ...get(field, 'form.item'), type: fieldType[0] });
        return [t.list(elType), {...options, item: itemOpt/*{...itemOpt, ...options.item} */}];
    }
    if (fieldType instanceof Function && fieldType.getIdentifiers instanceof Function) {
        const options = convertOptions(field);
        const type = typeof _.find(fieldType, (v, k) => !(v instanceof Function)) === 'string' ? String : Number;
        return [convertType(type), options];
    }
    throw new Error('unknown type ' + fieldType, fieldType);
}

export function fromAstronomy(cls, fields) {
    const [ type, options ] = convertField({ type: cls }, fields);
    return { type, options };
}