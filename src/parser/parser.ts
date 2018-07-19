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
            let chunkText: string = response.chunks.reduce((chunkString: string, chunk: any, index: number) => {
                if (response.chunks.length - 1 === index) {
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
            this._processChunks(limit, skip + limit - 1);
        } catch (error) {
            console.error(error);
            this._store.config.onParsingError(error);
        }
    }

    private _parseTags(chunkText: string, lastChunkStartIndex: number): Tags {

        // set to true if < in starting tag is found.
        let startTagMatch: boolean = false;
        // set to the index of < in starting tag (1.e. <>)
        let startIndex: number = 0;
        // set to the index of > in starting tag (1.e. <>)
        let endIndex: number = 0;
        // set to the index of < in the closing tag (1.e. </>)
        let closingtagIndex: number = 0;

        // iterate over individual character and keep updating `this._tags` object.
        return chunkText.split('').reduce((tags: Tags, char: string, index: number, array: Array<string>) => {

            // the first chunk text should skip all the characters till `_indexToStartFrom` index
            // because that part was processed in previous iteration
            if (this._indexToStartFrom > index) {
                return tags;
            }

            // condition to check find < in starting tag (1.e. <>)
            // second condition checks if < is not the end of the chunk string
            if (!!char && char === "<" && !!array[index + 1]) {
                
                //check for <?xml and <!DOCTYPE type tags and skip them
                // if (array[index + 1] === '?' || array[index + 1] === '!') {
                //     return;
                // }

                // checks if next character is not /, means it is not an ending tag (1.e. </>)
                if (array[index + 1] !== '/') {
                    // starting tag found
                    // increment the hierarchy count 
                    ++this.hierarchy;
                    // set the start index to current index
                    startIndex = index;
                    // set the start tag match flag to true as we found the start tag
                    startTagMatch = true;
                } else {
                    // this is < in closing tag (i.e. </>)
                    // this will be used to calculate the distance (tag length)
                    closingtagIndex = index;
                    // end of a tag decrement hierarchy count
                    --this.hierarchy;
                }
            }
            // if not <, check if it is > in starting tag (1.e. <>)
            // last condition will hold true in case of XML node attributes
            else if (!!char && (char === ">" || char === " ")) {
                // check if startTagMatch is set to confirm
                // that it is > in starting tag (i.e. <>)
                // if yes, build the tag
                if (startTagMatch) {
                    // set the start index to current index
                    endIndex = index;
                    // reset startTagMatch to avoid this path in next
                    // < in starting tag
                    startTagMatch = false;
                    // startIndex + 1 points to first character after <
                    // endIndex tag points to >
                    // text between `startIndex + 1` & endIndex is the tag
                    let name: string = chunkText.substring(startIndex + 1, endIndex);
                    // initialise it if this is first tag of its kind
                    tags[name] = tags[name] || {};
                    // set hierarchy
                    tags[name].hierarchy = tags[name].hierarchy || this.hierarchy;
                    // set index for end tag
                    tags[name].end = endIndex;
                } 
                // if not starting tag, it has to be the ending tag,
                // calculate the node distance
                // and increment the count here
                else if (closingtagIndex !== 0 && char !== " ") {
                    // closingtagIndex points to < & index is pointing to >
                    // use `closingtagIndex + 2` to skip < and / in closing tag
                    // so string in between `closingtagIndex + 2` and `index` is the tag
                    let name: string = chunkText.substring(closingtagIndex + 2, index);
                    // `closingtagIndex - 1` is the character before < in closing tag
                    // tags[name].end points to > in starting tag
                    // difference gives text between <> and </>
                    // if (!tags[name]) {
                    //     debugger;
                    // }
                    let currentDistance: number = (closingtagIndex - 1) - tags[name].end;
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
                    closingtagIndex = 0;
                }
            }
            return tags;
        }, this._tags);
    }

    private _getRootNode(): void {
        
    }
}

export { Parser }