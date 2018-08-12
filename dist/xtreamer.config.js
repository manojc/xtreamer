"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DB_NAME = "xtreamer_db";
exports.DB_NAME = DB_NAME;
const FILE_COLLECTION_NAME = "files";
exports.FILE_COLLECTION_NAME = FILE_COLLECTION_NAME;
const CHUNK_COLLECTION_PREFIX = "chunks";
exports.CHUNK_COLLECTION_PREFIX = CHUNK_COLLECTION_PREFIX;
const NODES_COLLECTION_PREFIX = "nodes";
exports.NODES_COLLECTION_PREFIX = NODES_COLLECTION_PREFIX;
const BUCKET_SIZE = 150;
exports.BUCKET_SIZE = BUCKET_SIZE;
const CHUNK_OFFSET = 1;
/**
 * Configuration file to setup xtreamer parameters.
 * Involves properties and callback methods
 * @class XtreamerConfig
 */
class XtreamerConfig {
    constructor() {
        /**
         * Optional Field.
         * The database name created to store streamed file references and file data.
         * Default name used is `xtreamer_db` if this property is not set.
         * @type {string}
         * @memberof XtreamerConfig
         */
        this.dbName = DB_NAME;
        /**
         * Optional Field.
         * The collection name to store streamed file references (url, size, status).
         * Default name used is `files` if this property is not set.
         * @type {string}
         * @memberof XtreamerConfig
         */
        this.fileCollectionName = FILE_COLLECTION_NAME;
        /**
         * Optional Field.
         * The collection name prefix to store chunks read from streamed files.
         * Default name used is `chunks` if this property is not set.
         * The collection name is combination of `prefix` & `_id` from file collection separated by `_`.
         * e.g. chunks_5b33ef8313db4618dce5c58f
         * @type {string}
         * @memberof XtreamerConfig
         */
        this.chunkCollectionPrefix = CHUNK_COLLECTION_PREFIX;
        /**
         * Optional Field.
         * The collection name prefix to store node parsed from read chunks.
         * Default name used is `nodes` if this property is not set.
         * The collection name is combination of `prefix` & `_id` from file collection separated by `_`.
         * e.g. nodes_5b33ef8313db4618dce5c58f
         * @type {string}
         * @memberof XtreamerConfig
         */
        this.nodeCollectionPrefix = NODES_COLLECTION_PREFIX;
        /**
         * Optional Field.
         * This is the count of chunks stored in `chunks` collection per insert query.
         * Default size is `150` (150 chunks read from file are held in memory at a time).
         * @type {number}
         * @memberof XtreamerConfig
         */
        this.bucketSize = BUCKET_SIZE;
        /**
         * Optional Field.
         * This is the count of chunks carried forward to use in next chunk parsing iteration.
         * Default value is `1` (last chunk from previous iteration would be the first in next iteration).
         * @type {number}
         * @memberof XtreamerConfig
         */
        this.chunkOffset = CHUNK_OFFSET;
    }
}
exports.XtreamerConfig = XtreamerConfig;
//# sourceMappingURL=xtreamer.config.js.map