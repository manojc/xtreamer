import { Streamer } from "./streamer";
import { XtreamerConfig } from "./streamer.config";
import { Parser } from "./parser";

export class Xstreamer {

    private _config: XtreamerConfig;
    private _streamer: Streamer;
    private _parser: Parser;

    public constructor() {
        this._streamer = this._streamer || new Streamer(this._streamingSuccessCallback.bind(this));
        this._parser = this._parser || new Parser(this._parsingSuccessCallback.bind(this));
    }

    public stream(fileUrl: string, config: XtreamerConfig): Promise<void> {
        return this._streamer.stream(fileUrl, config)
            .then(() => {
                this._config = config
                return Promise.resolve();
            })
            .catch((error: any) => {
                return Promise.reject(error);
            });
    }

    private _streamingSuccessCallback(fileId: string): void {
        this._parser.init(fileId, this._config);
    }

    private _parsingSuccessCallback(fileId: string): void {
    }
}