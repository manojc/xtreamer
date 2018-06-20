const DB_NAME: string = "xtreamer-db";
const FILE_COLLECTION_NAME: string = "xtreamer.files";
const CHUNK_COLLECTION_PREFIX: string = "xtreamer.chunks";
const BUCKET_SIZE: number = 150;

class XtreamerConfig {
    dbUrl: string;
    fileCollectionName?: string = FILE_COLLECTION_NAME;
    chunkCollectionName?: string = CHUNK_COLLECTION_PREFIX;
    dbName?: string = DB_NAME;
    chunkSize?: number = BUCKET_SIZE;
    onChunkProcesed?: (chunkIds: Array<string>) => void;
    onStreamingSuccess?: (fileId: string) => void;
    onStreamingError?: (error: any) => void;
    onParsingSuccess?: () => void;
    onParsingError?: (error: any) => void;
    onDatabaseConnection?: () => void;
}

export { XtreamerConfig, DB_NAME, FILE_COLLECTION_NAME, CHUNK_COLLECTION_PREFIX, BUCKET_SIZE }