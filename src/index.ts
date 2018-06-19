import { get } from "request";
import { DatabaseStorage } from "./database.storage";
import { XtreamerConfig } from "./streamer.config";

export class Xstreamer {

    private _storage: DatabaseStorage;
    private _config: XtreamerConfig;
    private chunks: Array<string> = [];

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
        let bucket: number = 0;
        let buffer: any = get(url)
            .on('complete', (): void => {
                //call success callback function, if provided.
                if (!!this._config.onSuccess && typeof this._config.onSuccess === "function") {
                    this._config.onSuccess(fileId);
                }
            })
            .on('data', (chunk: Buffer): void => {
                ++bucket;
                this.chunks.push(chunk.toString());
                if (bucket > this._config.chunkSize) {
                    buffer.pause();
                    bucket = 0;
                    this.insertChunks(fileId, buffer);
                }
            })
            .on("error", (error: Error): void => {
                //call error callback function, if provided.
                if (!!this._config.onError && typeof this._config.onError === "function") {
                    this._config.onError(error);
                }
            });
    }

    private insertChunks(fileId: string, buffer: any): void {
        //keep sending the processed data through the callback function, if provided.
        this._storage.addChunks(fileId, this.chunks)
            .then((chunkIds: Array<string>) => {
                if (!!this._config.onChunkProcesed && typeof this._config.onChunkProcesed === "function") {
                    this._config.onChunkProcesed(chunkIds.join(', '));
                }
                this.chunks = [];
                buffer.resume();
            })
            .catch((error: any) => {
                //call error callback function, if provided.
                if (!!this._config.onError && typeof this._config.onError === "function") {
                    this._config.onError(error);
                }
            });
    }
}