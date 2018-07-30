import { parseString } from "xml2js";
import { Base } from "../storage/base.model";
import { Tags } from "./parser.model";
import { DatabaseStore } from "../storage/database.store";

class NodeParser extends Base {

    //to be removed (along with usages)
    private count: number = 0;

    private _tags: Tags;
    private _nodes: Array<any>;
    private _rootNode: string;
    private _remainingChunkText: string = "";
    private _parsingSuccessCallback: () => void

    public constructor(parsingSuccessCallback: () => void) {
        super();
        this._parsingSuccessCallback = parsingSuccessCallback;
    }

    public async parse(fileId: string, store: DatabaseStore): Promise<void> {
        this._fileId = fileId;
        this._store = store;

        let response: { structure: Tags } = await this._store.getFile(this._fileId);
        this._tags = response.structure;

        if (!this._tags) {
            if (this._store.config.onParsingError && typeof this._store.config.onParsingError === "function") {
                this._store.config.onParsingError(`no tags were found for file id - ${this._fileId}!`);
            }
        }

        this._getRootNode();

        if (!this._rootNode) {
            if (this._store.config.onParsingError && typeof this._store.config.onParsingError === "function") {
                this._store.config.onParsingError(`no root node found for file id - ${this._fileId}!`);
            }
        }

        this._nodes = [];

        this._processNodes(this._store.config.bucketSize);
    }

    private _getRootNode(): void {

        let smallestIndex: number = 9999999;

        Object.keys(this._tags).forEach((tagName: string) => {

            if (!tagName || !this._tags[tagName]) {
                return;
            }

            if (tagName.indexOf("!") > -1) {
                return;
            }

            if (this._tags[tagName].hierarchyList.indexOf(1) > -1) {
                this._rootNode = tagName;
            }

            this._tags[tagName].hierarchyList.sort();

            if (this._tags[tagName].hierarchyList[0] < smallestIndex && this._tags[tagName].count > 1) {
                smallestIndex = this._tags[tagName].hierarchyList[0];
                this._rootNode = tagName;
            }
        });
    }

    private async _processNodes(limit: number = 10, skip: number = 0): Promise<any> {
        try {
            // paginated response using limit and count
            let response: { chunks: Array<{ chunk: string }>, count: number };
            response = await this._store.getChunks(this._fileId, limit, skip);

            // check if no response, stop processing and save tags here
            if (!response || !response.chunks || !response.chunks.length) {
                if (this._nodes && this._nodes.length) {
                    await this._store.addNodes(this._fileId, this._nodes);
                }
                if (this._store.config.onNodeParsingSuccess && typeof this._store.config.onNodeParsingSuccess === "function") {
                    this._store.config.onNodeParsingSuccess();
                }
                if (this._parsingSuccessCallback && typeof this._parsingSuccessCallback === "function") {
                    this._parsingSuccessCallback();
                }
                return;
            }

            let chunkText: string = response.chunks.reduce((chunkString: string, chunkObj: { chunk: string }, index: number) => {
                return chunkString + chunkObj.chunk;
            }, this._remainingChunkText);

            this._remainingChunkText = "";
            await this._parseNodes(chunkText);

            this._processNodes(this._store.config.bucketSize, skip + limit)

        } catch (error) {
            console.error(error);
            if (this._store.config.onParsingError && typeof this._store.config.onParsingError === "function") {
                this._store.config.onParsingError(error);
            }
        }
    }

    private async _parseNodes(chunkText: string): Promise<any> {

        if (this._nodes.length === this._store.config.bucketSize * 10) {
            this.count = this.count + this._nodes.length;
            console.log(this.count);            
            await this._store.addNodes(this._fileId, this._nodes);
            this._nodes = [];
        }

        if (!chunkText) {
            this._remainingChunkText = "";
            return;
        }

        let startIndex: number = chunkText.indexOf(`<${this._rootNode}`);
        let endIndex: number = chunkText.indexOf(`</${this._rootNode}>`);

        if (endIndex < 0) {
            this._remainingChunkText = chunkText;
            return;
        }

        endIndex += 3 + this._rootNode.length;

        let node: string = chunkText.substring(startIndex, endIndex);

        if (!node) {
            this._remainingChunkText = chunkText;
            return;
        }

        let xmlNode: any;

        try {
            xmlNode = await this.xml2jsparser(node);
            xmlNode = xmlNode[this._rootNode];
        } catch (error) {
            if (this._store.config.onParsingError && typeof this._store.config.onParsingError === "function") {
                this._store.config.onParsingError(error);
            }
            return;
        }

        this._nodes.push(xmlNode);
        chunkText = chunkText.slice(endIndex);
        return await this._parseNodes(chunkText);
    }

    // converts callback to promise
    private xml2jsparser(node: string): Promise<any> {
        return new Promise<any>((resolve: (xmlNode: any) => void, reject: (error: any) => void) => {
            parseString(node, { attrkey: "__attributes", explicitArray: false }, (error: any, xmlNode: any) => {
                if (error) {
                    return reject(error);
                }
                return resolve(xmlNode);
            });
        });
    }
}

export { NodeParser }