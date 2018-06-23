import { XtreamerConfig } from "../streamer/streamer.config";
import { DatabaseStorage } from "../storage/database.storage";

class Base {

    protected _storage: DatabaseStorage;
    protected _config: XtreamerConfig;
    protected _fileId: string;

    public constructor() {
        this._storage = new DatabaseStorage();
    }

}

export { Base }