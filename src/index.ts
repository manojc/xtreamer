import { Base } from "./storage/base.model";
import { XtreamerConfig } from "./streamer/streamer.config";
import { Streamer } from "./streamer/streamer";
import { ChunkParser } from "./parser/chunk.parser";
import { NodeParser } from "./parser/node.parser";

export class Xtreamer extends Base {

    private _streamer: Streamer;
    private _chunkParser: ChunkParser;
    private _nodeParser: NodeParser;

    public constructor() {
        super();
        this._streamer = this._streamer || new Streamer(this._streamingSuccessCallback.bind(this));
        this._chunkParser = this._chunkParser || new ChunkParser(this._chunkParsingSuccessCallback.bind(this));
        this._nodeParser = this._nodeParser || new NodeParser(this._nodeParsingSuccessCallback.bind(this));
    }

    public init(fileUrl: string, config: XtreamerConfig): Promise<void> {
        return this._connect(fileUrl, config)
            .then(() => {
                this._streamer.stream(this._fileUrl, this._fileId, this._store);
                // this._chunkParser.parse(this._fileId, this._store);
                // this._nodeParser.parse(this._fileId, this._store);
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
        this._chunkParser.parse(this._fileId, this._store);
    }

    private _chunkParsingSuccessCallback(): void {
        this._nodeParser.parse(this._fileId, this._store);
    }

    private _nodeParsingSuccessCallback(): void {
    }
}