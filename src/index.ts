import { get, Request } from "request";
import { DatabaseStorage } from "./database.storage";
import { XtreamerConfig } from "./streamer.config";

export class Xstreamer {

    private _storage: DatabaseStorage;
    private _config: XtreamerConfig;
    private chunks: Array<string> = [];
    private _buffer: Request;

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
                    .then((_id: string) => this._stream(fileUrl, _id))
                    .catch((error: any) => Promise.reject(error));
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    private _stream(url: string, fileId: string): void {
        this._buffer = get(url)
            .on('complete', (): void => {
                //call success callback function, if provided.
                if (!!this._config.onSuccess && typeof this._config.onSuccess === "function") {
                    this._config.onSuccess(fileId);
                }
            })
            .on('data', (chunk: Buffer): void => {
                this.chunks.push(chunk.toString());
                if (this.chunks.length > this._config.chunkSize) {
                    this._buffer.pause();
                    this.insertChunks(fileId);
                }
            })
            .on("error", (error: Error): void => {
                //call error callback function, if provided.
                if (!!this._config.onError && typeof this._config.onError === "function") {
                    this._config.onError(error);
                }
            });
    }

    private insertChunks(fileId: string): void {
        //keep sending the processed data through the callback function, if provided.
        this._storage.addChunks(fileId, this.chunks)
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