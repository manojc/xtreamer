import { XtreamerConfig } from "./streamer.config";
import { DatabaseStorage } from "./database.storage";

class Parser {

    private _config: XtreamerConfig;
    private _storage: DatabaseStorage;
    private _parsingSuccessCallback: (fileId: string) => void;
    private _fileId: string;

    public constructor(parsingSuccessCallback: (fileId: string) => void) {
        this._parsingSuccessCallback = parsingSuccessCallback;
    }

    public init(fileId: string, config: XtreamerConfig): Promise<void> {
        return this._storage.connect(config)
            .then(() => {
                this._fileId = fileId
                this._config = config;
                return Promise.resolve();
            })
            .catch((error: any) => {
                return Promise.reject(error);
            })
    }
}

export { Parser }