import { connect } from "mongoose";
import { Model, Document } from "mongoose";
import { FileSchemaInstance } from "./file.schema";
import { ChunkSchemaInstance } from "./chunk.schema";
import { XtreamerConfig, DB_NAME, FILE_COLLECTION_NAME, CHUNK_COLLECTION_PREFIX, BUCKET_SIZE } from "../streamer/streamer.config";
import { ObjectID } from "bson";

class DatabaseStore {

    private _file: Model<Document>;
    private _chunk: Model<Document>;
    private _config: XtreamerConfig;
    public get config(): XtreamerConfig {
        return this._config;
    }

    public connect(config: XtreamerConfig): Promise<void> {
        if (!!this._config) {
            return Promise.resolve();
        }
        return this._validate(config)
            .then(() => { return this._connect() })
            .catch((error: Error) => {
                return Promise.reject(error)
            });
    }

    public addFile(url: string): Promise<string> {
        return this._file.findOne({ url: url })
            .then((doc: Document) => {
                if (!!doc) {
                    return Promise.resolve(doc._id.toString());
                }
                return this._file.create({ url: url })
                    .then((doc: Document) => {
                        return Promise.resolve(doc._id.toString());
                    })
                    .catch((error: Error) => {
                        return Promise.reject(error)
                    });
            })
            .catch((error: Error) => {
                return Promise.reject(error)
            });
    }

    public updateFile(id: string, size: string): Promise<string> {
        return this._file
            .findOneAndUpdate(new ObjectID(id), {
                is_processed: true,
                file_size: parseInt(size)
            })
            .then((doc: Document) => {
                return Promise.resolve(doc._id.toString());
            })
            .catch((error: Error) => {
                return Promise.reject(error)
            });
    }

    public removeFile(id: string): Promise<void> {
        return this._file.findByIdAndRemove(new ObjectID(id))
            .then(() => {
                return this.dropChunkCollection(id)
                    .then(() => {
                        return Promise.resolve();
                    })
                    .catch((error: Error) => {
                        return Promise.reject(error)
                    });
            })
            .catch((error: Error) => {
                return Promise.reject(error);
            });
    }

    public addChunks(fileId: string, chunks: Array<string>): Promise<Array<string>> {
        this._chunk = ChunkSchemaInstance(fileId, this._config.chunkCollectionPrefix);
        const chunkDocs = chunks.reduce((chunkDocs: Array<any>, chunk: string) => {
            chunkDocs.push({
                file_id: new ObjectID(fileId),
                chunk: chunk
            });
            return chunkDocs;
        }, []);
        return this._chunk.insertMany(chunkDocs)
            .then((documents: Array<Document>) => {
                return Promise.resolve(documents.reduce((responseIds: Array<string>, doc: Document) => {
                    responseIds.push(doc._id.toString());
                    return responseIds;
                }, []));
            })
            .catch((error: Error) => {
                return Promise.reject(error);
            });
    }

    public getChunks(fileId: string, limit: number = 10, skip: number = 0): Promise<Array<string>> {
        try {
            this._chunk = ChunkSchemaInstance(fileId, this._config.chunkCollectionPrefix);
            return this._chunk
                .aggregate([
                    { $skip: isNaN(skip) ? 0 : skip },
                    { $limit: isNaN(limit) ? 10 : limit },
                    {
                        $project: {
                            _id: 0,
                            chunk: 1
                        }
                    }
                ])
                .then((chunks: Array<string>) => {
                    return Promise.resolve(chunks);
                })
                .catch((error: Error) => {
                    return Promise.reject(error);
                });
        } catch (error) {
            return Promise.reject(error)
        }
    }

    public async dropChunkCollection(fileId: string): Promise<void> {
        this._chunk = ChunkSchemaInstance(fileId, this._config.chunkCollectionPrefix);
        let list: Array<any> = await this._chunk.db.db.listCollections({ name: this._chunk.collection.name }).toArray();
        if (!list || !list.length) {
            return Promise.resolve();
        }
        return this._chunk.collection.drop()
            .then(() => {
                return Promise.resolve();
            })
            .catch((error: Error) => {
                return Promise.reject(error)
            });
    }

    //#region Private Methods

    private _validate(config: XtreamerConfig): Promise<void> {
        if (!config) {
            return Promise.reject("xtreamer config not provided!");
        }
        if (!config.dbUrl || !config.dbUrl.trim()) {
            return Promise.reject("database URL not provided!");
        }
        config.dbName = !!config.dbName && !!config.dbName.trim() ? config.dbName.trim() : DB_NAME;
        config.fileCollectionName = !!config.fileCollectionName && !!config.fileCollectionName.trim() ? config.fileCollectionName.trim() : FILE_COLLECTION_NAME;
        config.chunkCollectionPrefix = !!config.chunkCollectionPrefix && !!config.chunkCollectionPrefix.trim() ? config.chunkCollectionPrefix.trim() : CHUNK_COLLECTION_PREFIX;
        config.bucketSize = isNaN(config.bucketSize) && config.bucketSize > 0 ? config.bucketSize : BUCKET_SIZE;
        this._config = config;
        return Promise.resolve();
    }

    private _connect(): Promise<void> {
        return connect(`${this._config.dbUrl.trim()}/${this._config.dbName.trim()}`)
            .then(() => {
                this._file = FileSchemaInstance(this._config.fileCollectionName);
                if (this._config.onDatabaseConnectionSuccess && typeof this._config.onDatabaseConnectionSuccess === "function") {
                    this._config.onDatabaseConnectionSuccess();
                }
                return Promise.resolve();
            })
            .catch((error: Error) => {
                if (this._config.onDatabaseConnectionError && typeof this._config.onDatabaseConnectionError === "function") {
                    this._config.onDatabaseConnectionError(error);
                }
                return Promise.reject(`could not connect to ${this._config.dbUrl.trim()}/${this._config.dbName.trim()}`);
            });
    }

    //#endregion
}

export { DatabaseStore };