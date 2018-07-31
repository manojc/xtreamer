import { parseString } from "xml2js";
import { Tags } from "./parser.model";
import { DatabaseStore } from "../storage/database.store";

class NodeParser {

    private _tags: Tags;
    private _nodes: Array<any>;
    private _rootNode: string;
    private _remainingChunkText: string = "";
    private _parsingSuccessCallback: () => void

    public constructor(parsingSuccessCallback: () => void) {
        this._parsingSuccessCallback = parsingSuccessCallback;
    }

    public async parse(): Promise<void> {
        let response: { structure: Tags } = await DatabaseStore.getFile(DatabaseStore.fileId);
        this._tags = response.structure;

        if (!this._tags) {
            if (DatabaseStore.config.onParsingError && typeof DatabaseStore.config.onParsingError === "function") {
                DatabaseStore.config.onParsingError(`no tags were found for file id - ${DatabaseStore.fileId}!`);
            }
        }

        this._getRootNode();

        if (!this._rootNode) {
            if (DatabaseStore.config.onParsingError && typeof DatabaseStore.config.onParsingError === "function") {
                DatabaseStore.config.onParsingError(`no root node found for file id - ${DatabaseStore.fileId}!`);
            }
        }

        this._nodes = [];

        this._processNodes(DatabaseStore.config.bucketSize - 50);
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
            response = await DatabaseStore.getChunks(DatabaseStore.fileId, limit, skip);

            // check if no response, stop processing and save tags here
            if (!response || !response.chunks || !response.chunks.length) {
                if (this._nodes && this._nodes.length) {
                    let nodeCount: number = await DatabaseStore.addNodes(DatabaseStore.fileId, this._nodes);
                    if (!!DatabaseStore.config.onNodesParsed && typeof DatabaseStore.config.onNodesParsed === "function") {
                        DatabaseStore.config.onNodesParsed(nodeCount);
                    }
                }
                if (DatabaseStore.config.onNodeParsingSuccess && typeof DatabaseStore.config.onNodeParsingSuccess === "function") {
                    DatabaseStore.config.onNodeParsingSuccess();
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

            this._processNodes(DatabaseStore.config.bucketSize, skip + limit)

        } catch (error) {
            console.error(error);
            if (DatabaseStore.config.onParsingError && typeof DatabaseStore.config.onParsingError === "function") {
                DatabaseStore.config.onParsingError(error);
            }
        }
    }

    private async _parseNodes(chunkText: string): Promise<any> {

        if (this._nodes.length === DatabaseStore.config.bucketSize - 50) {
            let nodeCount: number = await DatabaseStore.addNodes(DatabaseStore.fileId, this._nodes);
            if (!!DatabaseStore.config.onNodesParsed && typeof DatabaseStore.config.onNodesParsed === "function") {
                DatabaseStore.config.onNodesParsed(nodeCount);
            }
            this._nodes = [];
        }

        if (!chunkText) {
            this._remainingChunkText = "";
            return;
        }

        const nodeMatcher = new RegExp(`<${this._rootNode}( |>)`);        
        let startIndex: number = chunkText.search(nodeMatcher);
        let endIndex: number = chunkText.indexOf(`</${this._rootNode}>`);

        if (startIndex <0 || endIndex < 0) {
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
            this._nodes.push(xmlNode);
        } catch (error) {
            if (DatabaseStore.config.onParsingError && typeof DatabaseStore.config.onParsingError === "function") {
                DatabaseStore.config.onParsingError({ node: node, error: error, message: "invalid XML node found! Check error for details." });
            }
        }
        chunkText = chunkText.slice(endIndex);
        return await this._parseNodes(chunkText);
    }

    // converts callback to promise
    private xml2jsparser(node: string): Promise<any> {
        return new Promise<any>((resolve: (xmlNode: any) => void, reject: (error: any) => void) => {
            parseString(
                node,
                {
                    attrkey: "__attributes",
                    explicitArray: false,
                    emptyTag: true
                },
                (error: any, xmlNode: any) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve(xmlNode);
                });
        });
    }
}

export { NodeParser }