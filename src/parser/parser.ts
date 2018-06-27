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
        return chunk.split('').reduce((tags: Tags, char: string, index: number, array: Array<string>) => {
            if (!!char && char === "<" && !!array[index + 1]) {
                if (array[index + 1] !== '/') {
                    ++hierarchy;
                    startIndex = index;
                    endIndex = 0;
                } else {
                    --hierarchy;
                }
            }
            if (!!char && (char === ">" || char === " ") && endIndex === 0) {
                endIndex = index;
                let name: string = chunk.substring(startIndex + 1, endIndex);
                tags[name] = tags[name] || { hierarchy: hierarchy, distance: endIndex - startIndex };
                tags[name][Object.keys(tags[name]).length + 1] = {
                    start: startIndex,
                    end: endIndex
                };
            }
            return tags;
        }, {});
    }
}

export { Parser }