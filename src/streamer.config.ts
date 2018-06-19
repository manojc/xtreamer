interface XtreamerConfig {
    fileCollectionName: string;
    chunkCollectionName: string;
    dbName: string;
    dbUrl: string;
    onChunkProcesed: (shunkId: string) => void;
    onSuccess: (fileId: string) => void;
    onError: (error: any) => void;
    connectCallback: () => void;
}

export { XtreamerConfig }