import { DatabaseStore } from "../storage/database.store";
import { Tags } from "./parser.model";

class ChunkParser {

    private _tags: Tags;
    private _indexToStartFrom: number;
    private _hierarchy: number = 0;
    private _parsingSuccessCallback: () => void;

    public constructor(parsingSuccessCallback: () => void) {
        this._parsingSuccessCallback = parsingSuccessCallback;
    }

    public parse(): void {
        this._tags = new Tags();
        this._indexToStartFrom = 0;
        this._hierarchy = 0;
        this._processChunks(DatabaseStore.config.bucketSize - 50);
    }

    private async _processChunks(limit: number = 10, skip: number = 0): Promise<void> {
        try {
            let response: { chunks: Array<{ chunk: string }>, count: number };
            response = await DatabaseStore.getChunks(DatabaseStore.fileId, limit, skip);

            if (!response || !response.chunks || !response.chunks.length) {
                await DatabaseStore.updateFile(DatabaseStore.fileId, {
                    structure: this._tags
                });
                return this._onParsingSuccess();
            }

            let lastChunkStartIndex: number = 0;
            
            let chunkText: string = response.chunks.reduce((chunkString: string, chunkObj: { chunk: string }, index: number) => {
                if (response.chunks.length - DatabaseStore.config.chunkOffset === index) {
                    lastChunkStartIndex = chunkString.length;
                }
                chunkString += chunkObj.chunk;
                return chunkString;
            }, "");
            
            this._tags = this._parseTags(chunkText, lastChunkStartIndex, skip + limit >= response.count);

            if (DatabaseStore.config.onChunksParsed && typeof DatabaseStore.config.onChunksParsed === "function") {
                DatabaseStore.config.onChunksParsed(response.chunks.length);
            }
            this._processChunks(limit, skip + limit - DatabaseStore.config.chunkOffset);

        } catch (error) {
            if (DatabaseStore.config.onParsingError && typeof DatabaseStore.config.onParsingError === "function") {
                DatabaseStore.config.onParsingError(error);
            }
        }
    }

    private _parseTags(chunkText: string, lastChunkStartIndex: number, isLastIteration: boolean): Tags {
        let openingTagOpeningBracketIndex: number = -1;
        let closingTagOpeningBracketIndex: number = 0;
        let exitLoop: boolean = false;

        return chunkText.split('').reduce((tags: Tags, currentChar: string, index: number, array: Array<string>) => {
            
            if (this._indexToStartFrom > index || (exitLoop && !isLastIteration)) {
                return tags;
            }

            if (currentChar === "<" && array[index + 1] === '/') {
                closingTagOpeningBracketIndex = index;
                openingTagOpeningBracketIndex = -1;
            } 
            
            else if (currentChar === "<" && array[index + 1] !== '/') {
                openingTagOpeningBracketIndex = index;
                closingTagOpeningBracketIndex = 0;
            } 
            
            else if ((currentChar === ">" || currentChar === " ") && openingTagOpeningBracketIndex >= 0) {
                let name: string = chunkText.substring(
                    openingTagOpeningBracketIndex + 1, index
                );
                let emptyTag: boolean = name[name.length - 1] === "/";
                if (emptyTag) {
                    name = name.slice(0, -1);
                }
                tags[name] = tags[name] || {};
                ++this._hierarchy;
                tags[name].hierarchyList = tags[name].hierarchyList || [];
                if (tags[name].hierarchyList.indexOf(this._hierarchy) < 0) {
                    tags[name].hierarchyList.push(Number(this._hierarchy));
                }
                tags[name].end = index;
                if (emptyTag) {
                    tags[name].distance = tags[name].distance ? tags[name].distance : 0;
                    tags[name].count = tags[name].count ? ++tags[name].count : 1;
                    --this._hierarchy;
                }
                if (name.indexOf(":") > -1) {
                    tags[name].namespace = name.split(":")[1].trim();
                }
                openingTagOpeningBracketIndex = -1;
            }

            else if (currentChar === ">" && closingTagOpeningBracketIndex > 0) {
                let name: string = chunkText.substring(closingTagOpeningBracketIndex + 2, index);
                let currentDistance: number = (closingTagOpeningBracketIndex - 1) - tags[name].end;
                tags[name].distance = tags[name].distance && currentDistance < tags[name].distance ?
                    tags[name].distance :
                    currentDistance;
                tags[name].count = tags[name] && tags[name].count ? ++tags[name].count : 1;
                closingTagOpeningBracketIndex = 0;
                --this._hierarchy;
                if (index >= lastChunkStartIndex) {
                    this._indexToStartFrom = (index + 1) - lastChunkStartIndex;
                    exitLoop = !isLastIteration;
                }
            }

            return tags;

        }, this._tags);
    }

    private _onParsingSuccess(): void {
        if (DatabaseStore.config.onChunkParsingSuccess && typeof DatabaseStore.config.onChunkParsingSuccess ===  "function") {
            DatabaseStore.config.onChunkParsingSuccess();
        }
        if (this._parsingSuccessCallback && typeof this._parsingSuccessCallback ===  "function") {
            this._parsingSuccessCallback();
        }
    }

}

export { ChunkParser }