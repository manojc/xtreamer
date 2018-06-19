import { get, Request } from "request";
import { DatabaseStorage } from "./database.storage";
import { XtreamerConfig } from "./streamer.config";

export class Xstreamer {

    private _storage: DatabaseStorage;
    private _config: XtreamerConfig;
    private chunks: Array<string> = [];
    private _buffer: Request;
    private fileId: string;

    public constructor() {
        this._storage = new DatabaseStorage();
    }

    public stream(fileUrl: string, config: XtreamerConfig): Promise<void> {
        if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.trim()) {
            return Promise.reject("invalid file URL!");
        }
        return this._storage.init(config)
            .then(() => {
                this._config = config;
                return this._storage.addFile(fileUrl)
                    .then((_id: string) => {
                        this.fileId = _id;
                        this._initStream(fileUrl);
                    })
                    .catch((error: any) => Promise.reject(error));
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
        this._storage.updateFile(this.fileId);
        //call success callback function, if provided.
        if (!!this._config.onSuccess && typeof this._config.onSuccess === "function") {
            this._config.onSuccess(this.fileId);
        }        
    }

    private _onStreamData(chunk: Buffer): void {
        this.chunks.push(chunk.toString());
        if (this.chunks.length >= this._config.chunkSize) {
            this._buffer.pause();
            this._insertChunks();
        }
    }

    private _onStreamError(error: Error): void {
        //rollback the database changes
        this._storage.removeFile(this.fileId);
        //call error callback function, if provided.
        if (!!this._config.onError && typeof this._config.onError === "function") {
            this._config.onError(error);
        }
    }

    private _insertChunks(): void {
        //keep sending the processed data through the callback function, if provided.
        this._storage.addChunks(this.fileId, this.chunks)
            .then((chunkIds: Array<string>) => {
                if (!!this._config.onChunkProcesed && typeof this._config.onChunkProcesed === "function") {
                    this._config.onChunkProcesed(chunkIds.join(', '));
                }
                this.chunks = [];
                this._buffer.resume();
            })
            .catch((error: any) => {
                //call error callback function, if provided.
                if (!!this._config.onError && typeof this._config.onError === "function") {
                    this._config.onError(error);
                }
            });
    }
}