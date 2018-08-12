"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const file_schema_1 = require("./file.schema");
const chunk_schema_1 = require("./chunk.schema");
const xtreamer_config_1 = require("../xtreamer.config");
const bson_1 = require("bson");
const node_schema_1 = require("./node.schema");
class DatabaseStore {
    static get config() {
        return this._config;
    }
    static get fileId() {
        return this._fileId;
    }
    static get fileUrl() {
        return this._fileUrl;
    }
    static init(config, fileUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._fileUrl = fileUrl;
                yield this._validate(config);
                yield this._connect();
                return Promise.resolve();
            }
            catch (error) {
                return Promise.reject(error);
            }
        });
    }
    static getFile(fileId) {
        return this._file.findOne({ _id: fileId }, { _id: 0, structure: 1 })
            .then((response) => {
            return Promise.resolve(response);
        })
            .catch((error) => {
            return Promise.reject(error);
        });
    }
    static addFile(url) {
        return this._file.findOne({ url: url })
            .then((doc) => __awaiter(this, void 0, void 0, function* () {
            if (!!doc) {
                this._fileId = doc._id.toString();
                yield this.dropChunkCollection(doc._id.toString());
                yield this.dropNodeCollection(doc._id.toString());
                return Promise.resolve(doc._id.toString());
            }
            return this._file.create({ url: url })
                .then((doc) => {
                this._fileId = doc._id.toString();
                return Promise.resolve(doc._id.toString());
            })
                .catch((error) => {
                return Promise.reject(error);
            });
        }))
            .catch((error) => {
            return Promise.reject(error);
        });
    }
    static updateFile(id, params) {
        return this._file
            .findOneAndUpdate({ _id: new bson_1.ObjectID(id) }, params)
            .then((doc) => {
            return Promise.resolve(doc._id.toString());
        })
            .catch((error) => {
            return Promise.reject(error);
        });
    }
    static removeFile(id) {
        return this._file.findByIdAndRemove(new bson_1.ObjectID(id))
            .then(() => {
            return this.dropChunkCollection(id)
                .then(() => {
                return Promise.resolve();
            })
                .catch((error) => {
                return Promise.reject(error);
            });
        })
            .catch((error) => {
            return Promise.reject(error);
        });
    }
    static addChunks(fileId, chunks) {
        this._chunk = chunk_schema_1.ChunkSchemaInstance(fileId, this._config.chunkCollectionPrefix);
        const chunkDocs = chunks.reduce((chunkDocs, chunk) => {
            chunkDocs.push({
                file_id: new bson_1.ObjectID(fileId),
                chunk: chunk
            });
            return chunkDocs;
        }, []);
        return this._chunk.insertMany(chunkDocs)
            .then((documents) => {
            return Promise.resolve(documents.length);
        })
            .catch((error) => {
            return Promise.reject(error);
        });
    }
    static getChunks(fileId, limit = 10, skip = 0) {
        try {
            this._chunk = chunk_schema_1.ChunkSchemaInstance(fileId, this._config.chunkCollectionPrefix);
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
                .then((chunks) => __awaiter(this, void 0, void 0, function* () {
                return Promise.resolve({
                    chunks: chunks,
                    count: yield this._chunk.count({})
                });
            }))
                .catch((error) => {
                return Promise.reject(error);
            });
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    static dropChunkCollection(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            this._chunk = chunk_schema_1.ChunkSchemaInstance(fileId, this._config.chunkCollectionPrefix);
            let list = yield this._chunk.db.db.listCollections({ name: this._chunk.collection.name }).toArray();
            if (!list || !list.length) {
                return Promise.resolve();
            }
            return this._chunk.collection.drop()
                .then(() => { return Promise.resolve(); })
                .catch((error) => { return Promise.reject(error); });
        });
    }
    static addNodes(fileId, nodes) {
        this._node = node_schema_1.NodeSchemaInstance(fileId, this._config.nodeCollectionPrefix);
        const nodeDocs = nodes.reduce((nodeDocs, node) => {
            nodeDocs.push({
                file_id: new bson_1.ObjectID(fileId),
                node: node
            });
            return nodeDocs;
        }, []);
        return this._node
            .insertMany(nodeDocs)
            .then((documents) => {
            return Promise.resolve(documents.length);
        })
            .catch((error) => {
            return Promise.reject(error);
        });
    }
    static dropNodeCollection(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            this._node = node_schema_1.NodeSchemaInstance(fileId, this._config.nodeCollectionPrefix);
            let list = yield this._node.db.db.listCollections({ name: this._node.collection.name }).toArray();
            if (!list || !list.length) {
                return Promise.resolve();
            }
            return this._node.collection.drop()
                .then(() => { return Promise.resolve(); })
                .catch((error) => { return Promise.reject(error); });
        });
    }
    //#region Private Methods
    static _validate(config) {
        if (!config) {
            return Promise.reject("xtreamer config not provided!");
        }
        if (!config.dbUrl || !config.dbUrl.trim()) {
            return Promise.reject("database URL not provided!");
        }
        config.dbName = !!config.dbName && !!config.dbName.trim() ? config.dbName.trim() : xtreamer_config_1.DB_NAME;
        config.fileCollectionName = !!config.fileCollectionName && !!config.fileCollectionName.trim() ? config.fileCollectionName.trim() : xtreamer_config_1.FILE_COLLECTION_NAME;
        config.chunkCollectionPrefix = !!config.chunkCollectionPrefix && !!config.chunkCollectionPrefix.trim() ? config.chunkCollectionPrefix.trim() : xtreamer_config_1.CHUNK_COLLECTION_PREFIX;
        config.nodeCollectionPrefix = !!config.nodeCollectionPrefix && !!config.nodeCollectionPrefix.trim() ? config.nodeCollectionPrefix.trim() : xtreamer_config_1.NODES_COLLECTION_PREFIX;
        config.bucketSize = isNaN(config.bucketSize) && config.bucketSize > 0 ? config.bucketSize : xtreamer_config_1.BUCKET_SIZE;
        DatabaseStore._config = config;
        return Promise.resolve();
    }
    static _connect() {
        return mongoose_1.connect(`${DatabaseStore._config.dbUrl.trim()}/${DatabaseStore._config.dbName.trim()}`)
            .then(() => {
            this._file = file_schema_1.FileSchemaInstance(DatabaseStore._config.fileCollectionName);
            if (DatabaseStore._config.onDatabaseConnectionSuccess && typeof DatabaseStore._config.onDatabaseConnectionSuccess === "function") {
                DatabaseStore._config.onDatabaseConnectionSuccess();
            }
            return Promise.resolve();
        })
            .catch((error) => {
            if (DatabaseStore._config.onDatabaseConnectionError && typeof DatabaseStore._config.onDatabaseConnectionError === "function") {
                DatabaseStore._config.onDatabaseConnectionError(error);
            }
            return Promise.reject(`could not connect to ${DatabaseStore._config.dbUrl.trim()}/${DatabaseStore._config.dbName.trim()}`);
        });
    }
}
exports.DatabaseStore = DatabaseStore;
//# sourceMappingURL=database.store.js.map