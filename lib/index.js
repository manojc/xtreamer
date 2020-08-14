const { Transform } = require("stream");
const { Constants, getNodeIndices } = require("./util");

class Xtreamer extends Transform {

    constructor(node, options) {
        super();
        this._xmlString = "";
        this._node = node;
        this._options = options;
    }

    async _transform(chunk, encoding, callback) {
        try {
            await this._parse(chunk);
            return callback();
        } catch (error) {
            return callback(error);
        }
    }

    _flush(done) {
        if (this._options.pass_all_nodes) {
          this.push(this._xmlString.trim());
        }
        done();
    }

    async _parse(chunk) {
        this._xmlString += chunk.toString();
        if (this._xmlString && this._xmlString.length >= this._options.max_xml_size) {
            this._xmlString = "";
            return this.destroy(Error(`Max limit (${this._options.max_xml_size} characters) of xml string is exceeded - ${this._xmlString.length}`));
        }
        const nodeIndices = getNodeIndices(this._xmlString, this._node);
        let nodes = [];
        let fromIndex = 0;

        for (let index = 0; index < nodeIndices.length; index++) {
            const nodeObj = nodeIndices[index];
            const endIndex = nodeObj.end + this._node.length + 3;
            const xmlNode = this._xmlString.slice(nodeObj.start, endIndex);

            if (this._options.pass_all_nodes) {
               const otherNode = this._xmlString.slice(fromIndex, nodeObj.start - 1).trim();
               fromIndex = endIndex;
               if (otherNode.length > 0) {
                   this.push(otherNode);
                   nodes.push(otherNode);
               }
            }
            this._options && this._options.transformer && typeof this._options.transformer === "function" ?
                this.push(JSON.stringify(await this._options.transformer(xmlNode))) :
                this.push(xmlNode);
            this.emit(Constants.XML_DATA, xmlNode);
            nodes.push(xmlNode);
        }
        nodes.forEach(node => { this._xmlString = this._xmlString.replace(node, ""); });
    }
}

module.exports = (node, options = { max_xml_size: Constants.MAX_XML_LENGTH }) => {
    if (!node || !node.trim()) {
        throw Error("invalid node name provided!");
    }
    options = options || {};
    options.max_xml_size = options.max_xml_size || Constants.MAX_XML_LENGTH;
    return new Xtreamer(node, options);
};
