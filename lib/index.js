const stream = require("stream")
const events = require("events");

const Events = {
    XML_DATA: "xmldata",
    JSON_DATA: "jsondata",
    ERROR: "error",
    END: "end",
    CLOSE: "close",
    MAX_XML_LENGTH: 10000000
};

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
                this._emitter.emit(Events.ERROR, error);
            } catch (err) {
                this._emitter.emit(Events.ERROR, error);
            }
        }
    }

    _flush(done) {
        done();
    }

    _bindEvents() {
        this._readableStream.on(Events.END, () => {
            this._emitter.emit(Events.END, { unparsedXml: this._xmlString.replace((/  |\r\n|\n|\r/gm), "") });
        });
        this._readableStream.on(Events.CLOSE, () => {
            this._emitter.emit(Events.CLOSE);
        });
        this._readableStream.on(Events.ERROR, (error) => {
            this._emitter.emit(Events.ERROR, error);
        });
    }



    parse(xmlString) {

        this._xmlString += xmlString;

        if (this._xmlString && this._xmlString.length >= Events.MAX_XML_LENGTH) {
            const error = {
                message: "Max limit of xml string is reached (10000000 characters)",
                length: this._xmlString.length
            }
            try {
                this._xmlString = "";
                this._readableStream.destroy();
                this.destroy();
                this._emitter.emit(Events.ERROR, error);
            } catch (err) {
                this._emitter.emit(Events.ERROR, error);
            }
        }

        // if (this._xmlString.indexOf(`<${this._options.node}`)) {
        //     ++this._hierarchy;
        // }

        if (this._xmlString.indexOf(`<${this._options.node}`) >= 0 && this._xmlString.indexOf(`</${this._options.node}>`) >= 0) {
            const startIndex = this._xmlString.indexOf(`<${this._options.node}`);
            const endIndex = this._xmlString.indexOf(`</${this._options.node}>`) + this._options.node.length + 3;
            const xmlNode = this._xmlString.slice(startIndex, endIndex);
            this._xmlString = this._xmlString.replace(xmlNode, "");
            if (!!this._options.emitXml) {
                this._emitter.emit(Events.XML_DATA, xmlNode);
            }
            if (!!this._options.emitJson) {
                // JSON conversion here!
            }
        }

        if (this._xmlString.indexOf(`<${this._options.node}`) >= 0 && this._xmlString.indexOf(`</${this._options.node}>`) >= 0) {
            this.parse("");
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