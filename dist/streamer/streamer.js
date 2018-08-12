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
const request_1 = require("request");
const database_store_1 = require("../storage/database.store");
const stream_1 = require("stream");
class Streamer {
    constructor(streamingSuccessCallback) {
        this._chunks = [];
        this._streamingSuccessCallback = streamingSuccessCallback;
    }
    stream() {
        request_1.get(database_store_1.DatabaseStore.fileUrl)
            .on("complete", (response) => this._onStreamComplete(response))
            .on("error", (error) => this._onStreamError(error))
            .pipe(this.buildTransform());
    }
    buildTransform() {
        if (!!this._transform) {
            return;
        }
        const that = this;
        this._transform = new stream_1.Transform({ objectMode: true });
        this._transform._transform = function (chunk, encoding, callback) {
            return __awaiter(this, void 0, void 0, function* () {
                yield that._onStreamData(chunk);
                callback();
            });
        };
        return this._transform;
    }
    _onStreamComplete(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.statusCode !== 200) {
                database_store_1.DatabaseStore.config.onStreamingError(`Error while reading file, error code - [${response.statusMessage}] - ${response.statusCode}`);
                database_store_1.DatabaseStore.removeFile(database_store_1.DatabaseStore.fileId);
                return;
            }
            //if final bucket is not full save remaining chunks here
            yield this._insertChunks(this._chunks);
            database_store_1.DatabaseStore.updateFile(database_store_1.DatabaseStore.fileId, {
                is_processed: true,
                file_size: parseInt(response.headers["content-length"] || "0") || 0
            });
            //call success callback function, if provided.
            if (!!database_store_1.DatabaseStore.config.onStreamingSuccess && typeof database_store_1.DatabaseStore.config.onStreamingSuccess === "function") {
                database_store_1.DatabaseStore.config.onStreamingSuccess(database_store_1.DatabaseStore.fileId);
            }
            //callback for stream parser
            if (!!this._streamingSuccessCallback && typeof this._streamingSuccessCallback === "function") {
                this._streamingSuccessCallback();
            }
        });
    }
    _onStreamData(chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            this._chunks = this._chunks || [];
            this._chunks.push(chunk.toString());
            if (this._chunks.length >= database_store_1.DatabaseStore.config.bucketSize) {
                yield this._insertChunks(this._chunks);
                this._chunks = [];
            }
            return Promise.resolve();
        });
    }
    _onStreamError(error) {
        //destroy the buffer and stop processing
        // this._buffer.destroy();
        //rollback the database changes
        database_store_1.DatabaseStore.removeFile(database_store_1.DatabaseStore.fileId);
        //call error callback function, if provided.
        if (!!database_store_1.DatabaseStore.config.onStreamingError && typeof database_store_1.DatabaseStore.config.onStreamingError === "function") {
            database_store_1.DatabaseStore.config.onStreamingError(error);
        }
    }
    _insertChunks(chunks) {
        if (!chunks || !chunks.length) {
            return Promise.resolve();
        }
        //keep sending the processed data through the callback function, if provided.
        return database_store_1.DatabaseStore.addChunks(database_store_1.DatabaseStore.fileId, chunks)
            .then((chunkCount) => {
            if (!!database_store_1.DatabaseStore.config.onChunksProcesed && typeof database_store_1.DatabaseStore.config.onChunksProcesed === "function") {
                database_store_1.DatabaseStore.config.onChunksProcesed(chunkCount);
            }
            return Promise.resolve();
        })
            .catch((error) => this._onStreamError(error));
    }
}
exports.Streamer = Streamer;
//# sourceMappingURL=streamer.js.map