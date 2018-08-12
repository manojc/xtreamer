import { XtreamerConfig } from "./xtreamer.config";
export declare class Xtreamer {
    private _streamer;
    private _chunkParser;
    private _nodeParser;
    init(fileUrl: string, config: XtreamerConfig): Xtreamer;
    start(): void;
    private _init;
    private _streamingSuccessCallback;
    private _chunkParsingSuccessCallback;
    private _nodeParsingSuccessCallback;
}
