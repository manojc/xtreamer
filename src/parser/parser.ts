import { XtreamerConfig } from "../streamer/streamer.config";
import { Base } from "../storage/base.model";
import { DatabaseStore } from "../storage/database.store";

class Parser extends Base {

    public constructor() {
        super();
    }

    public parse(fileId: string, store: DatabaseStore): void {
        this._fileId = fileId;
        this._store = store;
        this._store.config.onParsingSuccess();
    }

    private _processChunks(): void {
        this._store.getChunks(this._fileId, 1, 0)
            .then((chunks: Array<string>) => {
                console.log(chunks);
            })
            .catch((error: any) => {
                console.error(error);
            });
    }
}

export { Parser }