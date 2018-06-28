import { Base } from "../storage/base.model";
import { DatabaseStore } from "../storage/database.store";
import { Tags } from "./parser.model";

class Parser extends Base {

    private _tags: Tags;

    public constructor() {
        super();
    }

    public parse(fileId: string, store: DatabaseStore): void {
        this._fileId = fileId;
        this._store = store;
        this._tags = {};
        this._processChunks(this._store.config.bucketSize);
    }

    private async _processChunks(limit: number = 10, skip: number = 0): Promise<void> {
        try {
            let response: { chunks: Array<string>, count: number } = await this._store.getChunks(this._fileId, limit, skip)
            if (!response || !response.chunks || !response.chunks.length) {
                console.log(this._tags);
                this._store.updateFile(this._fileId, {
                    structure : this._tags
                });
                return this._store.config.onParsingSuccess();
            }
            this._tags = this._parseTags(response.chunks.reduce((chunkString: string, chunk: any) => {
                chunkString += chunk.chunk;
                return chunkString;
            }, ""));
            if (skip >= response.count) {
                console.log(this._tags);
                this._store.updateFile(this._fileId, {
                    structure : this._tags
                });
                return this._store.config.onParsingSuccess();
            }
            this._processChunks(limit, skip + limit - 1);
        } catch (error) {
            console.error(error);
            this._store.config.onParsingError(error);
        }
    }

    private _parseTags(chunk: string): Tags {
        let startTagMatch: boolean = false;
        let startIndex: number = 0;
        let endIndex: number = 0;
        let hierarchy: number = 0;
        let closingtagIndex: number = 0;
        return chunk.split('').reduce((tags: Tags, char: string, index: number, array: Array<string>) => {
            if (!!char && char === "<" && !!array[index + 1]) {
                if (array[index + 1] !== '/') {
                    ++hierarchy;
                    startIndex = index;
                    endIndex = 0;
                    startTagMatch = true;
                } else {
                    closingtagIndex = index;
                    --hierarchy;
                }
            }
            if (!!char && (char === ">" || char === " ")) {
                if (endIndex === 0 && startTagMatch) {
                    endIndex = index;
                    startTagMatch = false;
                    let name: string = chunk.substring(startIndex + 1, endIndex);
                    tags[name] = {
                        count: tags[name] && tags[name].count ? ++tags[name].count : 1,
                        hierarchy: tags[name] && tags[name].hierarchy ? tags[name].hierarchy : hierarchy,
                        end: endIndex,
                        distance: tags[name] && tags[name].distance ? tags[name].distance : 0
                    };
                } else if (closingtagIndex !== 0 && char !== " ") {
                    let name: string = chunk.substring(closingtagIndex + 2, index);
                    let currentDistance: number = (closingtagIndex - 1) - tags[name].end;
                    tags[name].distance = tags[name].distance && currentDistance < tags[name].distance ? tags[name].distance : currentDistance;
                }
            }
            return tags;
        }, this._tags);
    }
}

export { Parser }