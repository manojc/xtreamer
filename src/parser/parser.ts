import { Base } from "../storage/base.model";
import { DatabaseStore } from "../storage/database.store";
import { Tags } from "./parser.model";

class Parser extends Base {

    public constructor() {
        super();
    }

    public parse(fileId: string, store: DatabaseStore): void {
        this._fileId = fileId;
        this._store = store;
        this._processChunks();
    }

    private _processChunks(): void {
        // this._store.getChunks(this._fileId, this._store.config.bucketSize, 0)
        this._store.getChunks(this._fileId, 10, 0)
            .then((chunks: Array<string>) => {
                if (!chunks || !chunks.length) {
                    return this._store.config.onParsingError("No chunks found for parsing!");
                }
                console.log(this._parseTags(chunks.reduce((chunkString: string, chunk: any) => {
                    chunkString += chunk.chunk;
                    return chunkString;
                }, "")));
                this._store.config.onParsingSuccess();
            })
            .catch((error: any) => {
                console.error(error);
                this._store.config.onParsingError(error);
            });
    }

    private _parseTags(chunk: string): Tags {
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
                } else {
                    closingtagIndex = index;
                    --hierarchy;
                }
            }
            if (!!char && (char === ">" || char === " ")) {
                if (endIndex === 0) {
                    endIndex = index;
                    let name: string = chunk.substring(startIndex + 1, endIndex);
                    tags[name] = {
                        count: tags[name] && tags[name].count ? ++tags[name].count : 1,
                        hierarchy: hierarchy,
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
        }, {});
    }
}

export { Parser }