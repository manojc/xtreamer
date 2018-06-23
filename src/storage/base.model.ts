import { XtreamerConfig } from "../streamer/streamer.config";
import { DatabaseStore } from "../storage/database.store";

class Base {

    protected _store: DatabaseStore;
    protected _fileId: string;
    protected _fileUrl: string;

    public constructor() {
        this._store = new DatabaseStore();
    }
}

export { Base }