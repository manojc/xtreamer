import { get, Request } from "request";
import { Base } from "../storage/base.model";
import { DatabaseStore } from "../storage/database.store";
import { IncomingMessage } from "http";
import { Transform, TransformCallback } from "stream";

class Streamer extends Base {

    private _chunks: Array<string> = [];
    private _buffer: Request;
    private _transform: Transform;
    private _streamingSuccessCallback: () => void;

    public constructor(streamingSuccessCallback: () => void) {
        super();
        this._streamingSuccessCallback = streamingSuccessCallback;
    }

    public stream(fileUrl: string, fileId: string, store: DatabaseStore): void {
        this._store = store;
        this._fileId = fileId;
        this._fileUrl = fileUrl;
        get(this._fileUrl)
            .on("complete", (response: any) => this._onStreamComplete(response))
            .on("error",  (error: any) => this._onStreamError(error))
            .pipe(this.buildTransform());
    }

    private buildTransform(): Transform {
        if (!!this._transform) {
            return;
        }
        let that = this;
        this._transform = new Transform({ objectMode: true });
        this._transform._transform = async function(chunk: Buffer, encoding: string, callback: TransformCallback) {
            await that._onStreamData(chunk);
            callback();
        }
        return this._transform;
    }

    private async _onStreamComplete(response: IncomingMessage): Promise<void> {
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

    private async _onStreamData(chunk: Buffer): Promise<void> {
        this._chunks = this._chunks || [];
        this._chunks.push(chunk.toString());
        if (this._chunks.length >= this._store.config.bucketSize) {
            await this._insertChunks(this._chunks);
            this._chunks = [];
        }
        return Promise.resolve();
    }

    private _onStreamError(error: Error): void {
        //destroy the buffer and stop processing
        // this._buffer.destroy();
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