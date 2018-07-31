import { XtreamerConfig } from "./streamer/streamer.config";
import { DatabaseStore } from "./storage/database.store";
import { Streamer } from "./streamer/streamer";
import { ChunkParser } from "./parser/chunk.parser";
import { NodeParser } from "./parser/node.parser";

export class Xtreamer {

    private _streamer: Streamer;
    private _chunkParser: ChunkParser;
    private _nodeParser: NodeParser;

    public async init(fileUrl: string, config: XtreamerConfig): Promise<void> {
        await DatabaseStore.init(config, fileUrl);
        await DatabaseStore.addFile(fileUrl);
        this._streamer = new Streamer(this._streamingSuccessCallback.bind(this));
        this._streamer.stream();
        // this._chunkParser.parse();
        // this._nodeParser.parse();
    }

    private _streamingSuccessCallback(): void {
        this._chunkParser = new ChunkParser(this._chunkParsingSuccessCallback.bind(this));
        this._chunkParser.parse();
    }

    private _chunkParsingSuccessCallback(): void {
        this._nodeParser = new NodeParser(this._nodeParsingSuccessCallback.bind(this));
        this._nodeParser.parse();
    }

    private _nodeParsingSuccessCallback(): void {
    }
}