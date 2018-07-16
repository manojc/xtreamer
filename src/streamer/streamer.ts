import { get, Request } from "request";
import { Base } from "../storage/base.model";
import { DatabaseStore } from "../storage/database.store";
import { IncomingMessage } from "http";
import { createWriteStream } from "fs";

class Streamer extends Base {

    private _chunks: Array<string> = [];
    private _buffer: Request;
    private _streamingSuccessCallback: () => void;

    public constructor(streamingSuccessCallback: () => void) {
        super();
        this._streamingSuccessCallback = streamingSuccessCallback;
    }

    public stream(fileUrl: string, fileId: string, store: DatabaseStore): void {
        this._store = store;
        this._fileId = fileId;
        this._fileUrl = fileUrl;
        this._buffer = get(this._fileUrl, this._onResponse.bind(this))
            .on('data', this._onStreamData.bind(this))
            .on('complete', this._onStreamComplete.bind(this))
            .on("error", this._onStreamError.bind(this));
    }

    private async _onResponse(error: any, response: IncomingMessage, body: any): Promise<void> {
        if (response.statusCode !== 200) {
            this._store.config.onStreamingError(`Error while reading file, error code - [${response.statusMessage}] - ${response.statusCode}`);
            this._store.removeFile(this._fileId);
            return;
        }
        //if final bucket is not full save remaining chunks here
        await this._insertChunks(this._chunks);
        this._store.updateFile(this._fileId, {
            is_processed: true,
            file_size: parseInt(response.headers["content-length"] || "0") || 0
        });
        //call success callback function, if provided.
        if (!!this._store.config.onStreamingSuccess && typeof this._store.config.onStreamingSuccess === "function") {
            this._store.config.onStreamingSuccess(this._fileId);
        }
        //callback for stream parser
        if (!!this._streamingSuccessCallback && typeof this._streamingSuccessCallback === "function") {
            this._streamingSuccessCallback();
        }
    }

    private _onStreamComplete(): void {
    }

    private async _onStreamData(chunk: Buffer): Promise<void> {
        this._chunks = this._chunks || [];
        this._chunks.push(chunk.toString());
        if (this._chunks.length >= this._store.config.bucketSize) {
            console.log(this._chunks.length);
            this._buffer.pause();
            await this._insertChunks(this._chunks);
            delete this._chunks;
            this._buffer.resume();
        }
    }

    private _onStreamError(error: Error): void {
        //destroy the buffer and stop processing
        this._buffer.destroy();
        //rollback the database changes
        this._store.removeFile(this._fileId);
        //call error callback function, if provided.
        if (!!this._store.config.onStreamingError && typeof this._store.config.onStreamingError === "function") {
            this._store.config.onStreamingError(error);
        }
    }

    private _insertChunks(chunks: Array<string>): Promise<void> {
        if (!chunks || !chunks.length) {
            return Promise.resolve();
        }
        //keep sending the processed data through the callback function, if provided.
        return this._store.addChunks(this._fileId, chunks)
            .then((chunkIds: Array<string>) => {
                if (!!this._store.config.onChunksProcesed && typeof this._store.config.onChunksProcesed === "function") {
                    this._store.config.onChunksProcesed(chunkIds);
                }
                return Promise.resolve();
            })
            .catch((error: any) => this._onStreamError(error));
    }
}

export { Streamer }