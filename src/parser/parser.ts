import { XtreamerConfig } from "../streamer/streamer.config";
import { Base } from "../storage/base.model";

class Parser extends Base {

    private _parsingSuccessCallback: (fileId: string) => void;

    public constructor(parsingSuccessCallback: (fileId: string) => void) {
        super();
        this._parsingSuccessCallback = parsingSuccessCallback;;
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