import { get } from "request";
import { DatabaseStorage } from "./database.storage";
import { XtreamerConfig } from "./streamer.config";

export class Xstreamer {

    private _storage: DatabaseStorage;
    private _config: XtreamerConfig;

    public stream(url: string, config: XtreamerConfig): Promise<void> {
        
        if (!this._config) {
            try {
                this._storage = new DatabaseStorage(config);
            } catch (error) {
                return Promise.reject(error);
            }
        }

        this._config = config;
        
        if (!url || typeof url !== "string" || !url.trim()) {
            return Promise.reject("invalid file URL!");
        }

        return this._storage.addFile(url)
            .then((_id: string) => this._stream(url, _id))
            .catch((error: any) => Promise.reject(error));
    }

    private _stream(url: string, fileId: string): void {
        get(url)
            .on('complete', () => {
                //call success callback function, if provided.
                if (!!this._config.onSuccess && typeof this._config.onSuccess === "function") {
                    this._config.onSuccess(fileId);
                }
            })
            .on('data', (chunk: Buffer) => {
                //keep sending the processed data through the callback function, if provided.
                this._storage.addChunk(fileId, chunk.toString())
                    .then((chunkId: string) => {
                        if (!!this._config.onChunkProcesed && typeof this._config.onChunkProcesed === "function") {
                            this._config.onChunkProcesed(fileId);
                        }
                    })
                    .catch((error: any) => {
                        //call error callback function, if provided.
                        if (!!this._config.onError && typeof this._config.onError === "function") {
                            this._config.onError(error);
                        }
                    });
            })
            .on("error", (error: Error) => {
                //call error callback function, if provided.
                if (!!this._config.onError && typeof this._config.onError === "function") {
                    this._config.onError(error);
                }
            });
    }
}