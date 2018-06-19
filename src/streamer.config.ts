interface XtreamerConfig {
    fileCollectionName?: string;
    chunkCollectionName?: string;
    dbName?: string;
    dbUrl: string;
    onChunkProcesed?: (chunkId: string) => void;
    onSuccess?: (fileId: string) => void;
    onError?: (error: any) => void;
    connectCallback?: () => void;
}

export { XtreamerConfig }