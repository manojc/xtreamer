import { connect } from "mongoose";
import { Model, Document } from "mongoose";
import { FileSchemaInstance } from "./file.schema";
import { ChunkSchemaInstance } from "./chunk.schema";
import { XtreamerConfig, DB_NAME, FILE_COLLECTION_NAME, CHUNK_COLLECTION_PREFIX, BUCKET_SIZE, NODES_COLLECTION_PREFIX } from "../xtreamer.config";
import { ObjectID } from "bson";
import { NodeSchemaInstance } from "./node.schema";

class DatabaseStore {
    
    private static _config: XtreamerConfig;
    private static _fileId: string;
    private static _fileUrl: string;
    private static _file: Model<Document>;
    private static _chunk: Model<Document>;
    private static _node: Model<Document>;
    public static get config() : XtreamerConfig {
        return this._config;
    }
    public static get fileId() : string {
        return this._fileId;
    }
    public static get fileUrl() : string {
        return this._fileUrl;
    }

    public static async init(config: XtreamerConfig, fileUrl: string): Promise<void> {
        try {
            this._fileUrl = fileUrl;
            await this._validate(config);
            await this._connect();
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    }

    public static getFile(fileId: string): Promise<any> {
        return this._file.findOne({ _id: fileId }, { _id: 0, structure: 1 })
            .then((response: Document) => {
                return Promise.resolve(response)
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    public static addFile(url: string): Promise<string> {
        return this._file.findOne({ url: url })
            .then(async (doc: Document) => {
                if (!!doc) {
                    this._fileId = doc._id.toString();
                    await this.dropChunkCollection(doc._id.toString());
                    await this.dropNodeCollection(doc._id.toString());
                    return Promise.resolve(doc._id.toString());
                }
                return this._file.create({ url: url })
                    .then((doc: Document) => {
                        this._fileId = doc._id.toString();
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

    public static updateFile(id: string, params: { [key: string]: any }): Promise<string> {
        return this._file
            .findOneAndUpdate({ _id: new ObjectID(id)}, params)
            .then((doc: Document) => {
                return Promise.resolve(doc._id.toString());
            })
            .catch((error: Error) => {
                return Promise.reject(error)
            });
    }

    public static removeFile(id: string): Promise<void> {
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

    public static addChunks(fileId: string, chunks: Array<string>): Promise<number> {
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
                return Promise.resolve(documents.length);
            })
            .catch((error: Error) => {
                return Promise.reject(error);
            });
    }

    public static getChunks(fileId: string, limit: number = 10, skip: number = 0): Promise<{ chunks: Array<{ chunk: string }>, count: number }> {
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
                .then(async (chunks: Array<{ chunk: string }>) => {
                    return Promise.resolve({
                        chunks: chunks,
                        count: await this._chunk.count({})
                    });
                })
                .catch((error: Error) => {
                    return Promise.reject(error);
                });
        } catch (error) {
            return Promise.reject(error)
        }
    }

    public static async dropChunkCollection(fileId: string): Promise<void> {
        this._chunk = ChunkSchemaInstance(fileId, this._config.chunkCollectionPrefix);
        let list: Array<any> = await this._chunk.db.db.listCollections({ name: this._chunk.collection.name }).toArray();
        if (!list || !list.length) {
            return Promise.resolve();
        }
        return this._chunk.collection.drop()
            .then(() => { return Promise.resolve(); })
            .catch((error: Error) => { return Promise.reject(error) });
    }

    public static addNodes(fileId: string, nodes: Array<any>): Promise<number> {
        this._node = NodeSchemaInstance(fileId, this._config.nodeCollectionPrefix);
        const nodeDocs: Array<any> = nodes.reduce((nodeDocs: Array<any>, node: any) => {
            nodeDocs.push({
                file_id: new ObjectID(fileId),
                node: node
            });
            return nodeDocs;
        }, []);
        return this._node
            .insertMany(nodeDocs)
            .then((documents: Array<Document>) => {
                return Promise.resolve(documents.length);
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    public static async dropNodeCollection(fileId: string): Promise<void> {
        this._node = NodeSchemaInstance(fileId, this._config.nodeCollectionPrefix);
        let list: Array<any> = await this._node.db.db.listCollections({ name: this._node.collection.name }).toArray();
        if (!list || !list.length) {
            return Promise.resolve();
        }
        return this._node.collection.drop()
            .then(() => { return Promise.resolve(); })
            .catch((error: Error) => { return Promise.reject(error) });
    }

    //#region Private Methods

    private static _validate(config: XtreamerConfig): Promise<void> {
        if (!config) {
            return Promise.reject("xtreamer config not provided!");
        }
        if (!config.dbUrl || !config.dbUrl.trim()) {
            return Promise.reject("database URL not provided!");
        }
        config.dbName = !!config.dbName && !!config.dbName.trim() ? config.dbName.trim() : DB_NAME;
        config.fileCollectionName = !!config.fileCollectionName && !!config.fileCollectionName.trim() ? config.fileCollectionName.trim() : FILE_COLLECTION_NAME;
        config.chunkCollectionPrefix = !!config.chunkCollectionPrefix && !!config.chunkCollectionPrefix.trim() ? config.chunkCollectionPrefix.trim() : CHUNK_COLLECTION_PREFIX;
        config.nodeCollectionPrefix = !!config.nodeCollectionPrefix && !!config.nodeCollectionPrefix.trim() ? config.nodeCollectionPrefix.trim() : NODES_COLLECTION_PREFIX;
        config.bucketSize = isNaN(config.bucketSize) && config.bucketSize > 0 ? config.bucketSize : BUCKET_SIZE;
        DatabaseStore._config = config;
        return Promise.resolve();
    }

    private static _connect(): Promise<void> {
        return connect(`${DatabaseStore._config.dbUrl.trim()}/${DatabaseStore._config.dbName.trim()}`)
            .then(() => {
                this._file = FileSchemaInstance(DatabaseStore._config.fileCollectionName);
                if (DatabaseStore._config.onDatabaseConnectionSuccess && typeof DatabaseStore._config.onDatabaseConnectionSuccess === "function") {
                    DatabaseStore._config.onDatabaseConnectionSuccess();
                }
                return Promise.resolve();
            })
            .catch((error: Error) => {
                if (DatabaseStore._config.onDatabaseConnectionError && typeof DatabaseStore._config.onDatabaseConnectionError === "function") {
                    DatabaseStore._config.onDatabaseConnectionError(error);
                }
                return Promise.reject(`could not connect to ${DatabaseStore._config.dbUrl.trim()}/${DatabaseStore._config.dbName.trim()}`);
            });
    }

    //#endregion
}

export { DatabaseStore };