declare const DB_NAME: string;
declare const FILE_COLLECTION_NAME: string;
declare const CHUNK_COLLECTION_PREFIX: string;
declare const NODES_COLLECTION_PREFIX: string;
declare const BUCKET_SIZE: number;
/**
 * Configuration file to setup xtreamer parameters.
 * Involves properties and callback methods
 * @class XtreamerConfig
 */
declare class XtreamerConfig {
    /**
     * Required Field.
     * Specifiy database URL e.g. `mongodb://localhost`.
     * Xtreamer creates a new database with name specified in `dbName` property.
     * Default database name used is `xtreamer_db` if `dbName` property is not set.
     * @type {string}
     * @memberof XtreamerConfig
     */
    dbUrl: string;
    /**
     * Optional Field.
     * The database name created to store streamed file references and file data.
     * Default name used is `xtreamer_db` if this property is not set.
     * @type {string}
     * @memberof XtreamerConfig
     */
    dbName?: string;
    /**
     * Optional Field.
     * The collection name to store streamed file references (url, size, status).
     * Default name used is `files` if this property is not set.
     * @type {string}
     * @memberof XtreamerConfig
     */
    fileCollectionName?: string;
    /**
     * Optional Field.
     * The collection name prefix to store chunks read from streamed files.
     * Default name used is `chunks` if this property is not set.
     * The collection name is combination of `prefix` & `_id` from file collection separated by `_`.
     * e.g. chunks_5b33ef8313db4618dce5c58f
     * @type {string}
     * @memberof XtreamerConfig
     */
    chunkCollectionPrefix?: string;
    /**
     * Optional Field.
     * The collection name prefix to store node parsed from read chunks.
     * Default name used is `nodes` if this property is not set.
     * The collection name is combination of `prefix` & `_id` from file collection separated by `_`.
     * e.g. nodes_5b33ef8313db4618dce5c58f
     * @type {string}
     * @memberof XtreamerConfig
     */
    nodeCollectionPrefix?: string;
    /**
     * Optional Field.
     * This is the count of chunks stored in `chunks` collection per insert query.
     * Default size is `150` (150 chunks read from file are held in memory at a time).
     * @type {number}
     * @memberof XtreamerConfig
     */
    bucketSize?: number;
    /**
     * Optional Field.
     * This is the count of chunks carried forward to use in next chunk parsing iteration.
     * Default value is `1` (last chunk from previous iteration would be the first in next iteration).
     * @type {number}
     * @memberof XtreamerConfig
     */
    chunkOffset?: number;
    /**
     * Optional Field.
     * Callback function triggered after inserting bucketful of chunks.
     * By default, this function gets triggered after inserting 150 chunks.
     * Callback provides array of ids for inserted chunks.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onChunksProcesed?: (chunkCount: number) => void;
    /**
     * Optional Field.
     * Callback function triggered after parsing bucketful of chunks.
     * By default, this function gets triggered after inserting 150 nodes.
     * Callback provides array of ids for parsed chunks.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onChunksParsed?: (nodeCount: number) => void;
    /**
     * Optional Field.
     * Callback function triggered after inserting bucketful of nodes.
     * By default, this function gets triggered after inserting 150 nodes.
     * Callback provides array of ids for parsed nodes.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onNodesParsed?: (nodeCount: number) => void;
    /**
     * Callback function triggered after successful streaming.
     * Callback provides id of the file processed.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onStreamingSuccess?: (fileId: string) => void;
    /**
     * Callback function triggered if streaming fails.
     * Streaming failure removes the file reference and processed chunks from database.
     * Callback provides the error details.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onStreamingError?: (error: any) => void;
    /**
     * Callback function triggered after successful chunk parsing.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onChunkParsingSuccess?: () => void;
    /**
     * Callback function triggered after successful node parsing.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onNodeParsingSuccess?: () => void;
    /**
     * Callback function triggered if parsing fails.
     * Parsing failure removes the file reference and processed chunks from database.
     * Callback provides the error details.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onParsingError?: (error: any) => void;
    /**
     * Callback function triggered after successful database connection.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onDatabaseConnectionSuccess?: () => void;
    /**
     * Callback function triggered if an attempt to connect to the database fails.
     * @callback
     * @type {Function}
     * @memberof XtreamerConfig
     */
    onDatabaseConnectionError?: (error: any) => void;
}
export { XtreamerConfig, DB_NAME, FILE_COLLECTION_NAME, CHUNK_COLLECTION_PREFIX, NODES_COLLECTION_PREFIX, BUCKET_SIZE };
