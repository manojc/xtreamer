const { Transform } = require("stream")
const { Constants, getNodeIndices } = require("./util");

class Xtreamer extends Transform {

    constructor(node) {
        super();
        this._nodes = [];
        this._xmlString = "";
        this.node = node;
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

        if (this._xmlString && this._xmlString.length >= Constants.MAX_XML_LENGTH) {
            const error = {
                message: "Max limit of xml string is reached (10000000 characters)",
                length: this._xmlString.length
            }
            try {
                this._xmlString = "";
                this.destroy();
                this.emit(Constants.ERROR, error);
            } catch (err) {
                this.emit(Constants.ERROR, error);
            }
        }

        const nodeIndices = getNodeIndices(this._xmlString, this.node);
        

        if (!nodeIndices || !nodeIndices.length) {
            return;
        }

        for (let index = 0; index < nodeIndices.length; index++) {
            const nodeObj = nodeIndices[index];
            const endIndex = nodeObj.end + this.node.length + 3;
            const xmlNode = this._xmlString.slice(nodeObj.start, endIndex);
            this._nodes.push(xmlNode);
            this.emit(Constants.XML_DATA, xmlNode);
        }

        this._nodes.forEach(node => { 
            this._xmlString = this._xmlString.replace(node, "") 
        });
    }
}

module.exports = function (node) {
    if (!node || !node.trim()) {
        throw Error("invalid node name provided!");
    }
    return new Xtreamer(node);
}