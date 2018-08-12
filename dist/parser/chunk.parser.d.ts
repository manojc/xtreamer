declare class ChunkParser {
    private _tags;
    private _indexToStartFrom;
    private _hierarchy;
    private _parsingSuccessCallback;
    constructor(parsingSuccessCallback: () => void);
    parse(): void;
    private _processChunks;
    private _parseTags;
    private _onParsingSuccess;
}
export { ChunkParser };
