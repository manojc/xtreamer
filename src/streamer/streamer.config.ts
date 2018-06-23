const DB_NAME: string = "xtreamer_db";
const FILE_COLLECTION_NAME: string = "xtreamer_files";
const CHUNK_COLLECTION_PREFIX: string = "xtreamer_chunks";
const BUCKET_SIZE: number = 150;

class XtreamerConfig {
    dbUrl: string;
    fileCollectionName?: string = FILE_COLLECTION_NAME;
    chunkCollectionName?: string = CHUNK_COLLECTION_PREFIX;
    dbName?: string = DB_NAME;
    bucketSize?: number = BUCKET_SIZE;
    onChunksProcesed?: (chunkIds: Array<string>) => void;
    onStreamingSuccess?: (fileId: string) => void;
    onStreamingError?: (error: any) => void;
    onParsingSuccess?: () => void;
    onParsingError?: (error: any) => void;
    onDatabaseConnectionSuccess?: () => void;
    onDatabaseConnectionError?: (error: any) => void;
}

export { XtreamerConfig, DB_NAME, FILE_COLLECTION_NAME, CHUNK_COLLECTION_PREFIX, BUCKET_SIZE }