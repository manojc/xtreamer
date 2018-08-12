declare class Streamer {
    private _chunks;
    private _buffer;
    private _transform;
    private _streamingSuccessCallback;
    constructor(streamingSuccessCallback: () => void);
    stream(): void;
    private buildTransform;
    private _onStreamComplete;
    private _onStreamData;
    private _onStreamError;
    private _insertChunks;
}
export { Streamer };
