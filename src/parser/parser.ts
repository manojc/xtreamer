import { Base } from "../storage/base.model";
import { DatabaseStore } from "../storage/database.store";
import { Tags } from "./parser.model";

class Parser extends Base {

    private _tags: Tags;
    private _indexToStartFrom: number;
    private hierarchy: number = 0;

    public constructor() {
        super();
    }

    public parse(fileId: string, store: DatabaseStore): void {
        this._fileId = fileId;
        this._store = store;
        this._tags = {};
        this._indexToStartFrom = 0;
        this.hierarchy = 0;
        this._processChunks(this._store.config.bucketSize);
    }

    private async _processChunks(limit: number = 10, skip: number = 0): Promise<void> {
        try {
            // paginated response using limit and count
            let response: { chunks: Array<string>, count: number };
            response = await this._store.getChunks(this._fileId, limit, skip)

            // check if no response, stop processing and save tags here
            if (!response || !response.chunks || !response.chunks.length) {
                console.log(this._tags);
                this._store.updateFile(this._fileId, {
                    structure : this._tags
                });
                return this._store.config.onParsingSuccess();
            }

            // reset 
            let lastChunkStartIndex: number = 0;
            // calculate lastChunkStartIndex
            // this depends on how many previous chunks are reused
            // e.g. in case 1 chunk is reused, lastChunkStartIndex wil be the index pointing
            // to the first character in the last chunk.
            let chunkText: string = response.chunks.reduce((chunkString: string, chunk: any, index: number) => {
                // response.chunks.length - 1 if last one chunk is reused
                // general term would be response.chunks.length - n where n is 
                // number of last chunks reused.
                if (response.chunks.length - this._store.config.chunksReused === index) {
                    lastChunkStartIndex = chunkString.length;
                }
                chunkString += chunk.chunk;
                return chunkString;
            }, "");
            this._tags = this._parseTags(chunkText, lastChunkStartIndex);
            if (skip >= response.count) {
                console.log(this._tags);
                this._store.updateFile(this._fileId, {
                    structure : this._tags
                });
                return this._store.config.onParsingSuccess();
            }
            // chunk reuse logic (skip + limit - 1) which uses last one chunk
            // in general it'd be (skip + limit - n) where 
            // n is the number of last chunks reused.
            this._processChunks(limit, skip + limit - this._store.config.chunksReused);
        } catch (error) {
            console.error(error);
            this._store.config.onParsingError(error);
        }
    }

    private _parseTags(chunkText: string, lastChunkStartIndex: number): Tags {

        // set to true if < in starting tag is found.
        let openingTagFound: boolean = false;
        // set to the index of < in starting tag (i.e. <>)
        let openingTagOpeningBracketIndex: number = 0;
        // set to the index of > in starting tag (i.e. <>)
        let openingTagClosingBracketIndex: number = 0;
        // set to the index of < in the closing tag (i.e. </>)
        let closingTagOpeningBracketIndex: number = 0;

        // iterate over individual character and keep updating `this._tags` object.
        return chunkText.split('').reduce((tags: Tags, currentChar: string, index: number, array: Array<string>) => {

            // the first chunk text should skip all the characters till `_indexToStartFrom` index
            // because that part was processed in previous iteration
            if (this._indexToStartFrom > index) {
                return tags;
            }

            // condition to check find < in starting tag (i.e. <>)
            // second condition checks if < is not the end of the chunk string
            if (!!currentChar && currentChar === "<" && !!array[index + 1]) {
                
                //check for <?xml and <!DOCTYPE type tags and skip them
                // if (array[index + 1] === '?' || array[index + 1] === '!') {
                //     return;
                // }

                // checks if next character is not /, means it is not an ending tag (i.e. </>)
                if (array[index + 1] !== '/') {
                    // starting tag found
                    // increment the hierarchy count 
                    ++this.hierarchy;
                    // set the start index to current index
                    openingTagOpeningBracketIndex = index;
                    // set the start tag match flag to true as we found the start tag
                    openingTagFound = true;
                } else {
                    // this is < in closing tag (i.e. </>)
                    // this will be used to calculate the distance (tag length)
                    closingTagOpeningBracketIndex = index;
                    // end of a tag decrement hierarchy count
                    --this.hierarchy;
                }
            }
            // if not <, check if it is > in starting tag (i.e. <>)
            // last condition will hold true in case of XML node attributes
            else if (!!currentChar && (currentChar === ">" || currentChar === " ")) {
                // check if startTagMatch is set to confirm
                // that it is > in starting tag (i.e. <>)
                // if yes, build the tag
                if (openingTagFound) {
                    // set the start index to current index
                    openingTagClosingBracketIndex = index;
                    // reset startTagMatch to avoid this path in next
                    // < in starting tag
                    openingTagFound = false;
                    // startIndex + 1 points to first character after <
                    // endIndex tag points to >
                    // text between `startIndex + 1` & endIndex is the tag
                    let name: string = chunkText.substring(
                        openingTagOpeningBracketIndex + 1, openingTagClosingBracketIndex
                    );
                    // check if it's an empty tag
                    let emptyTag: boolean = name[name.length - 1] === "/";
                    if (emptyTag) {
                        name = name.slice(0, -1);
                    }
                    // check if it's a namespace tag
                    if (name.indexOf(":") > -1) {
                        tags[name] = tags[name] || {};
                        tags[name].namespace = name.split(":")[1].trim();
                    }
                    // initialise it if this is first tag of its kind
                    tags[name] = tags[name] || {};
                    // set hierarchy
                    tags[name].hierarchy = tags[name].hierarchy || this.hierarchy;
                    // set index for end tag
                    tags[name].end = openingTagClosingBracketIndex;
                    if (emptyTag) {
                        tags[name].distance = tags[name].distance ? tags[name].distance : 0;
                        tags[name].count = tags[name].count ? ++tags[name].count : 1;
                        // closingtagIndex = 0;
                        --this.hierarchy;
                    }
                } 
                // if not starting tag, it has to be the ending tag,
                // calculate the node distance
                // and increment the count here
                else if (closingTagOpeningBracketIndex !== 0 && currentChar !== " ") {
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
                    // mark this as the end of the tag processing
                    // this helps getting the start point in case this is the last
                    // closing tag in current chunk string
                    this._indexToStartFrom = (index + 1) - lastChunkStartIndex;
                    //reset the closing tag here which will stop counting the nodes until it is et in
                    // opening tag logic
                    closingTagOpeningBracketIndex = 0;
                }
            }
            return tags;
        }, this._tags);
    }

    private _getRootNode(): void {
        
    }
}

export { Parser }