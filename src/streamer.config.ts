class XtreamerConfig {
    dbUrl: string;
    fileCollectionName?: string = "xtreamer.files";
    chunkCollectionName?: string = "xtreamer.chunks";
    dbName?: string = "xtreamer-db";
    chunkSize?: number = 150;
    onChunkProcesed?: (chunkId: string) => void;
    onSuccess?: (fileId: string) => void;
    onError?: (error: any) => void;
    connectCallback?: () => void;
}

export { XtreamerConfig }