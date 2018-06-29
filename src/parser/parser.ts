import { Base } from "../storage/base.model";
import { DatabaseStore } from "../storage/database.store";
import { Tags } from "./parser.model";

class Parser extends Base {

    private _tags: Tags;
    private _indexToStartFrom: number;

    public constructor() {
        super();
    }

    public parse(fileId: string, store: DatabaseStore): void {
        this._fileId = fileId;
        this._store = store;
        this._tags = {};
        this._indexToStartFrom = 0;
        this._processChunks(this._store.config.bucketSize);
    }

    private async _processChunks(limit: number = 10, skip: number = 0): Promise<void> {
        try {
            let response: { chunks: Array<string>, count: number };
            response = await this._store.getChunks(this._fileId, limit, skip)
            if (!response || !response.chunks || !response.chunks.length) {
                console.log(this._tags);
                this._store.updateFile(this._fileId, {
                    structure : this._tags
                });
                return this._store.config.onParsingSuccess();
            }
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
            debugger;
            console.error(error);
            this._store.config.onParsingError(error);
        }
    }

    private _parseTags(chunkText: string, lastChunkStartIndex: number): Tags {

        //set to true if < in starting tag is found.
        let startTagMatch: boolean = false;
        //set to the index of < in starting tag (1.e. <>)
        let startIndex: number = 0;
        //set to the index of > in starting tag (1.e. <>)
        let endIndex: number = 0;
        //set to the position of the current node in XML tree
        let hierarchy: number = 0;
        //set to the index of < in the closing tag (1.e. </>)
        let closingtagIndex: number = 0;

        //iterate over individual character and keep updating `this._tags` object.
        return chunkText.split('').reduce((tags: Tags, char: string, index: number, array: Array<string>) => {

            if (this._indexToStartFrom > index) {
                return tags;
            }

            //condition to check find < in starting tag (1.e. <>)
            //second condition checks if < is not the end of the chunk string
            if (!!char && char === "<" && !!array[index + 1]) {
                //checks if next character is not /, means it is not an ending tag (1.e. </>)
                if (array[index + 1] !== '/') {
                    //starting tag found
                    //increment the hierarchy count 
                    ++hierarchy;
                    //set the start index to current index
                    startIndex = index;
                    //set the start tag match flag to true as we found the start tag
                    startTagMatch = true;
                } else {
                    //this is < in closing tag (i.e. </>)
                    //this will be used to calculate the distance (tag length)
                    closingtagIndex = index;
                    //end of a tag decrement hierarchy count
                    --hierarchy;
                }
            }
            //if not <, check if it is > in starting tag (1.e. <>)
            //last condition will hold true in case of XML node attributes
            else if (!!char && (char === ">" || char === " ")) {
                //check if startTagMatch is set to confirm
                //that it is > in starting tag (i.e. <>)
                //if yes, build the tag
                if (startTagMatch) {
                    endIndex = index;
                    startTagMatch = false;
                    let name: string = chunkText.substring(startIndex + 1, endIndex);
                    if (!tags[name]) {
                        tags[name] = {
                            count: 0,
                            hierarchy: 0,
                            end: 0,
                            distance: 0
                        };
                    }
                    tags[name].hierarchy = hierarchy;
                    tags[name].end = endIndex;
                } 
                //if not starting tag, it has to be ending tag, calculate the node distance
                else if (closingtagIndex !== 0 && char !== " ") {
                    let name: string = chunkText.substring(closingtagIndex + 2, index);
                    let currentDistance: number = (closingtagIndex - 1) - tags[name].end;
                    tags[name].distance = tags[name].distance && currentDistance < tags[name].distance ? 
                                            tags[name].distance : 
                                            currentDistance;
                    tags[name].count = tags[name] && tags[name].count ? ++tags[name].count : 1,
                    //mark this as the end of the tag processing
                    this._indexToStartFrom = (index + 1) - lastChunkStartIndex;
                }
            }
            return tags;
        }, this._tags);
    }

    private _getRootNode(): void {
        
    }
}

export { Parser }