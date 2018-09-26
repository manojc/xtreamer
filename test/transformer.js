const xmlParser = require('xml-js');

function _modifyValue(value, parentElement, type) {
    if (!parentElement._parent) {
        return value;
    }
    let keys = Object.keys(parentElement._parent);
    if (!keys || !keys.length) {
        return value;
    }
    let parentKey;
    let obj = {};
    // get parent key, it is the last key of parent object
    switch (type) {
        case "cdata":
            parentKey = `${keys[keys.length - 1]}_cdata`;
            break;
        case "text":
            parentKey = `${keys[keys.length - 1]}_text`;
            break;
        default:
            break;
    }
    obj[parentKey] = value;
    return obj;
}

function transformer(xmlText) {
    xmlText = xmlText.toString().replace("\ufeff", "");
    const options = {
        compact: true,
        trim: true,
        ignoreComment: true,
        ignoreDoctype: true,
        cdataFn: (value, parentElement) => { return _modifyValue(value, parentElement, "cdata") },
        textFn: (value, parentElement) => { return _modifyValue(value, parentElement, "text") },
    };
    return xmlParser.xml2js(xmlText, options);
}

function transformerPromise(xmlText) {
    return Promise.resolve(transformer(xmlText));
}

module.exports = {
    transformer: transformer,
    transformerPromise: transformerPromise
};