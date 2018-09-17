const { Transform } = require("stream")
const { Constants, getNodeIndices } = require("./util");

class Xtreamer extends Transform {

    constructor(node, options) {
        super();
        this._xmlString = "";
        this._node = node;
        this._options = options;
    }

    _transform(chunk, encoding, callback) {
        try {
            this._parse(chunk);
            return callback();
        } catch (error) {
            return callback(error);
        }
    }

    _flush(done) {
        done();
    }

    _parse(chunk) {

        this._xmlString += chunk.toString();

        if (this._xmlString && this._xmlString.length >= this._options.max_xml_size) {
            const error = {
                message: `Max limit of xml string is reached (${this._options.max_xml_size} characters)`,
                length: this._xmlString.length
            }
            this._xmlString = "";
            return this.destroy(error);
        }

        const nodes = getNodeIndices(this._xmlString, this._node).map(nodeObj => {
            const endIndex = nodeObj.end + this._node.length + 3;
            const xmlNode = this._xmlString.slice(nodeObj.start, endIndex);
            this.emit("data", xmlNode);
            this.emit(Constants.XML_DATA, xmlNode);
            return xmlNode;
        }) || [];

        nodes.forEach(node => {
            this._xmlString = this._xmlString.replace(node, "");
        });

        return nodes;
    }
}

module.exports = function (node, options = { max_xml_size: 10000000 }) {
    if (!node || !node.trim()) {
        throw Error("invalid node name provided!");
    }
    options = options || {};
    options.max_xml_size = options.max_xml_size || Constants.MAX_XML_LENGTH;
    return new Xtreamer(node, options);
}