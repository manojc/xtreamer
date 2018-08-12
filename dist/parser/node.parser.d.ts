declare class NodeParser {
    private _tags;
    private _nodes;
    private _rootNode;
    private _remainingChunkText;
    private _parsingSuccessCallback;
    constructor(parsingSuccessCallback: () => void);
    parse(): Promise<void>;
    private _getRootNode;
    private _processNodes;
    private _parseNodes;
    private xml2jsparser;
}
export { NodeParser };
