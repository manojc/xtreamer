import { get, Request } from "request";
import { XtreamerConfig } from "./streamer.config";
import { Base } from "../storage/base.model";

class Streamer extends Base {

    private _chunks: Array<string> = [];
    private _buffer: Request;
    private _streamingSuccessCallback: (fileId: string) => void;

    public constructor(streamingSuccessCallback: (fileId: string) => void) {
        super();
        this._streamingSuccessCallback = streamingSuccessCallback;
    }

    public stream(fileUrl: string, config: XtreamerConfig): Promise<void> {
        if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.trim()) {
            return Promise.reject("invalid file URL!");
        }
        return this._storage.connect(config)
            .then(() => {
                this._config = config;
                return this._storage.addFile(fileUrl)
                    .then((_id: string) => {
                        this._fileId = _id;
                        this._initStream(fileUrl);
                    })
                    .catch((error: any) => {
                        return Promise.reject(error);
                    });
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    private _initStream(url: string): void {
        this._buffer = get(url)
            .on('complete', this._onStreamComplete.bind(this))
            .on('data', this._onStreamData.bind(this))
            .on("error", this._onStreamError.bind(this));
    }

    private _onStreamComplete(): void {
        //update file collection status
        this._storage.updateFile(this._fileId);
        //call success callback function, if provided.
        if (!!this._config.onStreamingSuccess && typeof this._config.onStreamingSuccess === "function") {
            this._config.onStreamingSuccess(this._fileId);
        }
        //callback for stream parser
        if (!!this._streamingSuccessCallback && typeof this._streamingSuccessCallback === "function") {
            this._streamingSuccessCallback(this._fileId);
        }
    }

    private _onStreamData(chunk: Buffer): void {
        this._chunks.push(chunk.toString());
        if (this._chunks.length >= this._config.chunkSize) {
            this._buffer.pause();
            this._insertChunks();
        }
    }

    private _onStreamError(error: Error): void {
        //destroy the buffer and stop processing
        this._buffer.destroy();
        //rollback the database changes
        this._storage.removeFile(this._fileId);
        //call error callback function, if provided.
        if (!!this._config.onStreamingError && typeof this._config.onStreamingError === "function") {
            this._config.onStreamingError(error);
        }
    }

    private _insertChunks(): void {
        //keep sending the processed data through the callback function, if provided.
        this._storage.addChunks(this._fileId, this._chunks)
            .then((chunkIds: Array<string>) => {
                if (!!this._config.onChunkProcesed && typeof this._config.onChunkProcesed === "function") {
                    this._config.onChunkProcesed(chunkIds);
                }
                this._chunks = [];
                this._buffer.resume();
            })
            .catch((error: any) => this._onStreamError(error));
    }
}

export { Streamer }