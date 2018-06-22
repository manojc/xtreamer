import { XtreamerConfig } from "./streamer.config";
import { DatabaseStorage } from "./database.storage";

class Parser {

    private _config: XtreamerConfig;
    private _storage: DatabaseStorage;
    private _parsingSuccessCallback: (fileId: string) => void;
    private _fileId: string;

    public constructor(parsingSuccessCallback: (fileId: string) => void) {
        this._parsingSuccessCallback = parsingSuccessCallback;;
        this._storage = new DatabaseStorage();
    }

    public init(fileId: string, config: XtreamerConfig): Promise<void> {
        return this._storage.connect(config)
            .then(() => {
                this._fileId = fileId
                this._config = config;
                this._processChunks();
                return Promise.resolve();
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    private _processChunks(): void {
        this._storage.getChunks(this._fileId, 1, 0)
            .then((chunks: Array<string>) => {
                console.log(chunks);
            })
            .catch((error: any) => {
                console.error(error);
            });
    }
}

export { Parser }