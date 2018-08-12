"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_store_1 = require("./storage/database.store");
const streamer_1 = require("./streamer/streamer");
const chunk_parser_1 = require("./parser/chunk.parser");
const node_parser_1 = require("./parser/node.parser");
class Xtreamer {
    init(fileUrl, config) {
        this._init(fileUrl, config);
        return this;
    }
    start() {
        this._streamer = new streamer_1.Streamer(this._streamingSuccessCallback.bind(this));
        this._streamer.stream();
        // this._chunkParser.parse();
        // this._nodeParser.parse();
    }
    _init(fileUrl, config) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_store_1.DatabaseStore.init(config, fileUrl);
            yield database_store_1.DatabaseStore.addFile(fileUrl);
            return Promise.resolve();
        });
    }
    _streamingSuccessCallback() {
        this._chunkParser = new chunk_parser_1.ChunkParser(this._chunkParsingSuccessCallback.bind(this));
        this._chunkParser.parse();
    }
    _chunkParsingSuccessCallback() {
        this._nodeParser = new node_parser_1.NodeParser(this._nodeParsingSuccessCallback.bind(this));
        this._nodeParser.parse();
    }
    _nodeParsingSuccessCallback() {
    }
}
exports.Xtreamer = Xtreamer;
//# sourceMappingURL=xtreamer.js.map