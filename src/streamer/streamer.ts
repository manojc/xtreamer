import { get, Request } from "request";
import { DatabaseStore } from "../storage/database.store";
import { IncomingMessage } from "http";
import { Transform, TransformCallback } from "stream";

class Streamer {

    private _chunks: Array<string> = [];
    private _buffer: Request;
    private _transform: Transform;
    private _streamingSuccessCallback: () => void;

    public constructor(streamingSuccessCallback: () => void) {
        this._streamingSuccessCallback = streamingSuccessCallback;
    }

    public stream(): void {
        get(DatabaseStore.fileUrl)
            .on("complete", (response: any) => this._onStreamComplete(response))
            .on("error",  (error: any) => this._onStreamError(error))
            .pipe(this.buildTransform());
    }

    private buildTransform(): Transform {
        if (!!this._transform) {
            return;
        }
        const that: Streamer = this;
        this._transform = new Transform({ objectMode: true });
        this._transform._transform = async function(chunk: Buffer, encoding: string, callback: TransformCallback) {
            await that._onStreamData(chunk);
            callback();
        }
        return this._transform;
    }

    private async _onStreamComplete(response: IncomingMessage): Promise<void> {
        if (response.statusCode !== 200) {
            DatabaseStore.config.onStreamingError(`Error while reading file, error code - [${response.statusMessage}] - ${response.statusCode}`);
            DatabaseStore.removeFile(DatabaseStore.fileId);
            return;
        }
        //if final bucket is not full save remaining chunks here
        await this._insertChunks(this._chunks);
        DatabaseStore.updateFile(DatabaseStore.fileId, {
            is_processed: true,
            file_size: parseInt(response.headers["content-length"] || "0") || 0
        });
        //call success callback function, if provided.
        if (!!DatabaseStore.config.onStreamingSuccess && typeof DatabaseStore.config.onStreamingSuccess === "function") {
            DatabaseStore.config.onStreamingSuccess(DatabaseStore.fileId);
        }
        //callback for stream parser
        if (!!this._streamingSuccessCallback && typeof this._streamingSuccessCallback === "function") {
            this._streamingSuccessCallback();
        }
    }

    private async _onStreamData(chunk: Buffer): Promise<void> {
        this._chunks = this._chunks || [];
        this._chunks.push(chunk.toString());
        if (this._chunks.length >= DatabaseStore.config.bucketSize) {
            await this._insertChunks(this._chunks);
            this._chunks = [];
        }
        return Promise.resolve();
    }

    private _onStreamError(error: Error): void {
        //destroy the buffer and stop processing
        // this._buffer.destroy();
        //rollback the database changes
        DatabaseStore.removeFile(DatabaseStore.fileId);
        //call error callback function, if provided.
        if (!!DatabaseStore.config.onStreamingError && typeof DatabaseStore.config.onStreamingError === "function") {
            DatabaseStore.config.onStreamingError(error);
        }
    }

    private _insertChunks(chunks: Array<string>): Promise<void> {
        if (!chunks || !chunks.length) {
            return Promise.resolve();
        }
        //keep sending the processed data through the callback function, if provided.
        return DatabaseStore.addChunks(DatabaseStore.fileId, chunks)
            .then((chunkCount: number) => {
                if (!!DatabaseStore.config.onChunksProcesed && typeof DatabaseStore.config.onChunksProcesed === "function") {
                    DatabaseStore.config.onChunksProcesed(chunkCount);
                }
                return Promise.resolve();
            })
            .catch((error: any) => this._onStreamError(error));
    }
}

export { Streamer }