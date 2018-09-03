const { Transform } = require("stream")
const { Constants, getNodeIndices } = require("./util");

class Xtreamer extends Transform {

    constructor(node, options) {
        super();
        this._nodes = [];
        this._xmlString = "";
        this._node = node;
        this._options = options;
    }

    _transform(chunk, encoding, callback) {
        try {
            this._nodes = [];
            this.parse(chunk.toString());
            callback();
        } catch (error) {
            callback(error);
        }
    }

    _flush(done) {
        done();
    }

    parse(xmlString) {

        this._xmlString += xmlString;

        if (this._xmlString && this._xmlString.length >= this._options.max_xml_size) {
            const error = {
                message: `Max limit of xml string is reached (${this._options.max_xml_size} characters)`,
                length: this._xmlString.length
            }
            try {
                this.emit(Constants.ERROR, error);
                this._xmlString = "";
                this.destroy();
            } catch (err) {
                this.emit(Constants.ERROR, error);
            }
        }

        const nodeIndices = getNodeIndices(this._xmlString, this._node);


        if (!nodeIndices || !nodeIndices.length) {
            return;
        }

        for (let index = 0; index < nodeIndices.length; index++) {
            const nodeObj = nodeIndices[index];
            const endIndex = nodeObj.end + this._node.length + 3;
            const xmlNode = this._xmlString.slice(nodeObj.start, endIndex);
            this._nodes.push(xmlNode);
            this.emit(Constants.XML_DATA, xmlNode);
        }

        this._nodes.forEach(node => {
            this._xmlString = this._xmlString.replace(node, "")
        });
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