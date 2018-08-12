import { XtreamerConfig } from "../xtreamer.config";
declare class DatabaseStore {
    private static _config;
    private static _fileId;
    private static _fileUrl;
    private static _file;
    private static _chunk;
    private static _node;
    static readonly config: XtreamerConfig;
    static readonly fileId: string;
    static readonly fileUrl: string;
    static init(config: XtreamerConfig, fileUrl: string): Promise<void>;
    static getFile(fileId: string): Promise<any>;
    static addFile(url: string): Promise<string>;
    static updateFile(id: string, params: {
        [key: string]: any;
    }): Promise<string>;
    static removeFile(id: string): Promise<void>;
    static addChunks(fileId: string, chunks: Array<string>): Promise<number>;
    static getChunks(fileId: string, limit?: number, skip?: number): Promise<{
        chunks: Array<{
            chunk: string;
        }>;
        count: number;
    }>;
    static dropChunkCollection(fileId: string): Promise<void>;
    static addNodes(fileId: string, nodes: Array<any>): Promise<number>;
    static dropNodeCollection(fileId: string): Promise<void>;
    private static _validate;
    private static _connect;
}
export { DatabaseStore };
