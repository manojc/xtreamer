
const DB_NAME = "xtreamer-db";
const FILE_COLLECTION_NAME = "xtreamer.files";
const CHUNK_COLLECTION_PREFIX = "xtreamer.chunks";

class XtreamerConfig {
    dbUrl: string;
    fileCollectionName?: string = FILE_COLLECTION_NAME;
    chunkCollectionName?: string = CHUNK_COLLECTION_PREFIX;
    dbName?: string = DB_NAME;
    chunkSize?: number = 150;
    onChunkProcesed?: (chunkId: string) => void;
    onSuccess?: (fileId: string) => void;
    onError?: (error: any) => void;
    connectCallback?: () => void;
}

export { XtreamerConfig, DB_NAME, FILE_COLLECTION_NAME, CHUNK_COLLECTION_PREFIX }