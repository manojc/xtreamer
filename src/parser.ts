import { XtreamerConfig } from "./streamer.config";

class Parser {

    private _config: XtreamerConfig;
    private _parsingSuccessCallback: (fileId: string) => void;

    public constructor(parsingSuccessCallback: (fileId: string) => void) {
        this._parsingSuccessCallback = parsingSuccessCallback;
    }

    public init(fileUrl: string, config: XtreamerConfig): Promise<void> {
        return Promise.resolve();
    }
}

export { Parser }