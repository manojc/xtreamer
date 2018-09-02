const stream = require("stream")
const events = require("events");
const { Constants, getNodeIndices } = require("./util");

class Xtreamer extends stream.Transform {

    constructor(readableStream, options) {
        super();
        this._xmlString = "";
        this._hierarchy = 0;
        this._options = options;
        this._readableStream = readableStream;
        this._emitter = new events.EventEmitter();
        this._bindEvents();
    }

    _transform(chunk, encoding, callback) {
        try {
            this.parse(chunk.toString());
            callback();
        } catch (error) {
            try {
                this._readableStream.destroy();
                this.destroy();
                this._emitter.emit(Constants.ERROR, error);
            } catch (err) {
                this._emitter.emit(Constants.ERROR, error);
            }
        }
    }

    _flush(done) {
        done();
    }

    _bindEvents() {
        this._readableStream.on(Constants.END, () => {
            this._emitter.emit(Constants.END, { unparsedXml: this._xmlString.replace((/  |\r\n|\n|\r/gm), "") });
        });
        this._readableStream.on(Constants.CLOSE, () => {
            this._emitter.emit(Constants.CLOSE);
        });
        this._readableStream.on(Constants.ERROR, (error) => {
            this._emitter.emit(Constants.ERROR, error);
        });
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
                this._readableStream.destroy();
                this.destroy();
                this._emitter.emit(Constants.ERROR, error);
            } catch (err) {
                this._emitter.emit(Constants.ERROR, error);
            }
        }

        const nodeIndices = getNodeIndices(this._xmlString, this._options.node);

        if (!nodeIndices || !nodeIndices.length) {
            return;
        }

        for (let index = 0; index < nodeIndices.length; index++) {
            const nodeObj = nodeIndices[index];
            const endIndex = nodeObj.end + this._options.node.length + 3;
            const xmlNode = this._xmlString.slice(nodeObj.start, endIndex);
            this._xmlString = this._xmlString.replace(xmlNode, "");
            this._emitter.emit(Constants.XML_DATA, xmlNode);
        }
    }

    stream() {
        this._readableStream.pipe(this);
        return this._emitter;
    }
}

module.exports = function (readableStream, options) {
    if (!readableStream || !readableStream.pipe || typeof readableStream.pipe !== "function") {
        throw Error("invalid readable stream provided!");
    }
    if (!options || !options.node || !options.node.trim()) {
        throw Error("invalid node name provided!");
    }
    const streamer = new Xtreamer(readableStream, options);
    return streamer.stream();
}