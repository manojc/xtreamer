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

    public stream(url: string, config: XtreamerConfig): Promise<void> {

        if (!this._config) {
            return this._storage.init(config)
                .then(() => {
                    if (!url || typeof url !== "string" || !url.trim()) {
                        return Promise.reject("invalid file URL!");
                    }
                    this._config = config;
                    return this._storage.addFile(url)
                        .then((_id: string) => this._stream(url, _id))
                        .catch((error: any) => Promise.reject(error));
                })
                .catch((error: any) => {
                    return Promise.reject(error);
                });
        }
        
        if (!url || typeof url !== "string" || !url.trim()) {
            return Promise.reject("invalid file URL!");
        }

        this._config = config;
        
        return this._storage.addFile(url)
            .then((_id: string) => this._stream(url, _id))
            .catch((error: any) => Promise.reject(error));
    }

    private _stream(url: string, fileId: string): void {
        let bucket: number = 0;
        let buffer: any = get(url)
            .on('complete', () => {
                //call success callback function, if provided.
                if (!!this._config.onSuccess && typeof this._config.onSuccess === "function") {
                    this._config.onSuccess(fileId);
                }
            })
            .on('data', (chunk: Buffer) => {
                ++bucket;
                this.chunks.push(chunk.toString());
                if (bucket > this._config.chunkSize) {
                    buffer.pause();
                    bucket= 0;
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
            })
            .on("error", (error: Error) => {
                //call error callback function, if provided.
                if (!!this._config.onError && typeof this._config.onError === "function") {
                    this._config.onError(error);
                }
            });
    }
}