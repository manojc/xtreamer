import { Streamer } from "./streamer/streamer";
import { XtreamerConfig } from "./streamer/streamer.config";
import { Parser } from "./parser/parser";
import { Base } from "./storage/base.model";

export class Xtreamer extends Base {

    private _streamer: Streamer;
    private _parser: Parser;

    public constructor() {
        super();
        this._streamer = this._streamer || new Streamer(this._streamingSuccessCallback.bind(this));
        this._parser = this._parser || new Parser();
    }

    public init(fileUrl: string, config: XtreamerConfig): Promise<void> {
        return this._connect(fileUrl, config)
            .then(() => {
                this._parser.parse(this._fileId, this._store);
                // this._streamer.stream(this._fileUrl, this._fileId, this._store);
                return Promise.resolve();
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    private _connect(fileUrl: string, config: XtreamerConfig): Promise<void> {
        return this._store.connect(config)
            .then(() => {
                return this._insertFile(fileUrl);
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    private _insertFile(fileUrl: string): Promise<void> {
        if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.trim()) {
            return Promise.reject("invalid file URL!");
        }
        return this._store.addFile(fileUrl)
            .then((fileId: string) => {
                this._fileId = fileId;
                this._fileUrl = fileUrl;
                return Promise.resolve();
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    private _streamingSuccessCallback(): void {
        this._parser.parse(this._fileId, this._store);
    }
}