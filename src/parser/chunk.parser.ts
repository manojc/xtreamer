import { Base } from "../storage/base.model";
import { DatabaseStore } from "../storage/database.store";
import { Tags } from "./parser.model";

class ChunkParser extends Base {

    private _tags: Tags;
    private _indexToStartFrom: number;
    private _hierarchy: number = 0;
    private _parsingSuccessCallback: () => void;

    public constructor(parsingSuccessCallback: () => void) {
        super();
        this._parsingSuccessCallback = parsingSuccessCallback;
    }

    public parse(fileId: string, store: DatabaseStore): void {
        this._fileId = fileId;
        this._store = store;
        this._tags = new Tags();
        this._indexToStartFrom = 0;
        this._hierarchy = 0;
        this._processChunks(this._store.config.bucketSize - 50);
    }

    private async _processChunks(limit: number = 10, skip: number = 0): Promise<void> {
        try {
            // paginated response using limit and count
            let response: { chunks: Array<{ chunk: string }>, count: number };
            response = await this._store.getChunks(this._fileId, limit, skip);

            // check if no response, stop processing and save tags here
            if (!response || !response.chunks || !response.chunks.length) {
                await this._store.updateFile(this._fileId, {
                    structure: this._tags
                });
                return this._onParsingSuccess();
            }

            // reset lastChunkStartIndex
            let lastChunkStartIndex: number = 0;
            // calculate lastChunkStartIndex
            // this depends on how many previous chunks are reused
            // e.g. in case 1 chunk is reused, lastChunkStartIndex wil be the index pointing
            // to the first character in the last chunk.
            let chunkText: string = response.chunks.reduce((chunkString: string, chunkObj: { chunk: string }, index: number) => {
                // response.chunks.length - 1 if last one chunk is reused
                // general term would be response.chunks.length - n where n is 
                // number of last chunks reused.
                if (response.chunks.length - this._store.config.chunkOffset === index) {
                    lastChunkStartIndex = chunkString.length;
                }
                chunkString += chunkObj.chunk;
                return chunkString;
            }, "");
            
            this._tags = this._parseTags(chunkText, lastChunkStartIndex, skip + limit >= response.count);

            if (this._store.config.onChunksParsed && typeof this._store.config.onChunksParsed === "function") {
                this._store.config.onChunksParsed(response.chunks.length);
            }

            // chunk reuse logic (skip + limit - 1) which uses last one chunk
            // in general it'd be (skip + limit - n) where 
            // n is the number of last chunks reused.
            this._processChunks(limit, skip + limit - this._store.config.chunkOffset);

        } catch (error) {
            if (this._store.config.onParsingError && typeof this._store.config.onParsingError === "function") {
                this._store.config.onParsingError(error);
            }
        }
    }

    private _parseTags(chunkText: string, lastChunkStartIndex: number, isLastIteration: boolean): Tags {

        // set to the index of < in starting tag (i.e. <>)
        let openingTagOpeningBracketIndex: number = -1;
        // set to the index of < in the closing tag (i.e. </>)
        let closingTagOpeningBracketIndex: number = 0;

        let exitLoop: boolean = false;

        // iterate over individual character and keep updating `this._tags` object.
        return chunkText.split('').reduce((tags: Tags, currentChar: string, index: number, array: Array<string>) => {

            // the first chunk text should skip all the characters till `_indexToStartFrom` index
            // because that part was processed in previous iteration
            if (this._indexToStartFrom > index || (exitLoop && !isLastIteration)) {
                return tags;
            }

            // check for <?xml and <!DOCTYPE type tags a skip them
            // if (array[index + 1] === '?' || array[index + 1] === '!') {
            //     return;
            // }

            // condition to check find < in starting tag (i.e. <>)
            // second condition checks if < is not the end of the chunk string
            if (currentChar === "<" && array[index + 1] === '/') {
                // checks if next character is /, means it is an ending tag (i.e. </>)
                // set closingTagOpeningBracketIndex here
                closingTagOpeningBracketIndex = index;
                openingTagOpeningBracketIndex = -1;

                // else it will be a starting tag (i.e. <>)
                // set openingTagOpeningBracketIndex here
                // make sure openingTagOpeningBracketIndex is set before
                // setting closingTagOpeningBracketIndex
            } else if (currentChar === "<" && array[index + 1] !== '/') {
                // set the start index to current index
                openingTagOpeningBracketIndex = index;
                closingTagOpeningBracketIndex = 0;
            }

            // if not <, check if it is > in starting tag (i.e. <>)
            // or check if node is with xml attributes (i.e. <foo bar="bas"></foo>)
            // and check if startTagMatch is set to confirm that it is > in starting tag (i.e. <>)
            // if yes, build the tag
            else if ((currentChar === ">" || currentChar === " ") && openingTagOpeningBracketIndex >= 0) {

                // startIndex + 1 points to first character after <
                // endIndex tag points to >
                // text between `startIndex + 1` & endIndex is the tag
                let name: string = chunkText.substring(
                    openingTagOpeningBracketIndex + 1, index
                );

                // check if it's an empty tag
                let emptyTag: boolean = name[name.length - 1] === "/";
                if (emptyTag) {
                    name = name.slice(0, -1);
                }
                
                // initialise it if this is first tag of its kind
                tags[name] = tags[name] || {};
                // set hierarchy
                ++this._hierarchy;
                tags[name].hierarchyList = tags[name].hierarchyList || [];
                if (tags[name].hierarchyList.indexOf(this._hierarchy) < 0) {
                    tags[name].hierarchyList.push(Number(this._hierarchy));
                }
                // set index for end tag
                tags[name].end = index;
                if (emptyTag) {
                    tags[name].distance = tags[name].distance ? tags[name].distance : 0;
                    tags[name].count = tags[name].count ? ++tags[name].count : 1;
                    --this._hierarchy;
                }
                // check if it's a namespace tag
                if (name.indexOf(":") > -1) {
                    tags[name].namespace = name.split(":")[1].trim();
                }
                // reset startTagMatch to avoid this path in next
                // < in starting tag
                openingTagOpeningBracketIndex = -1;
            }

            // if not starting tag, it has to be the ending tag,
            // calculate the node distance and increment the count here
            else if (currentChar === ">" && closingTagOpeningBracketIndex > 0) {
                // closingtagIndex points to < & index is pointing to >
                // use `closingtagIndex + 2` to skip < and / in closing tag
                // so string in between `closingtagIndex + 2` and `index` is the tag
                let name: string = chunkText.substring(closingTagOpeningBracketIndex + 2, index);
                // `closingtagIndex - 1` is the character before < in closing tag
                // tags[name].end points to > in starting tag
                // difference gives text between <> and </>
                let currentDistance: number = (closingTagOpeningBracketIndex - 1) - tags[name].end;
                //replace previous distance if current distance is larger
                tags[name].distance = tags[name].distance && currentDistance < tags[name].distance ?
                    tags[name].distance :
                    currentDistance;
                // increment the count, initialise with 1 if first tag
                tags[name].count = tags[name] && tags[name].count ? ++tags[name].count : 1;
                //reset the closing tag here which will stop counting the nodes until 
                // it is set in opening tag logic
                closingTagOpeningBracketIndex = 0;
                // decrease the hierarchy once the tag count is incremented
                // next opening tag will increase it again
                --this._hierarchy;
                // mark this as the end of the tag processing
                // this helps getting the start point in case this is the last
                // closing tag in current chunk string
                // do this only if last chunk is being processed
                if (index >= lastChunkStartIndex) {
                    this._indexToStartFrom = (index + 1) - lastChunkStartIndex;
                    exitLoop = !isLastIteration;
                }
            }

            return tags;

        }, this._tags);
    }

    private _onParsingSuccess(): void {
        if (this._store.config.onChunkParsingSuccess && typeof this._store.config.onChunkParsingSuccess ===  "function") {
            this._store.config.onChunkParsingSuccess();
        }
        if (this._parsingSuccessCallback && typeof this._parsingSuccessCallback ===  "function") {
            this._parsingSuccessCallback();
        }
    }

    private _sortStructureByHierarchy(): Tags {
        if (!this._tags) {
            return;
        }    
        
        let sorted: Tags = {};

        Object.keys(this._tags).sort((tag1, tag2) => {
            this._tags[tag1].hierarchyList.sort();
            this._tags[tag2].hierarchyList.sort();
            return this._tags[tag1].hierarchyList[0] - this._tags[tag2].hierarchyList[0];
        }).forEach((key) => {
            sorted[key] = this._tags[key];
        });

        return sorted;
    }
}

export { ChunkParser }