"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const xml2js_1 = require("xml2js");
const database_store_1 = require("../storage/database.store");
class NodeParser {
    constructor(parsingSuccessCallback) {
        this._remainingChunkText = "";
        this._parsingSuccessCallback = parsingSuccessCallback;
    }
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield database_store_1.DatabaseStore.getFile(database_store_1.DatabaseStore.fileId);
            this._tags = response.structure;
            if (!this._tags) {
                if (database_store_1.DatabaseStore.config.onParsingError && typeof database_store_1.DatabaseStore.config.onParsingError === "function") {
                    database_store_1.DatabaseStore.config.onParsingError(`no tags were found for file id - ${database_store_1.DatabaseStore.fileId}!`);
                }
            }
            this._getRootNode();
            if (!this._rootNode) {
                if (database_store_1.DatabaseStore.config.onParsingError && typeof database_store_1.DatabaseStore.config.onParsingError === "function") {
                    database_store_1.DatabaseStore.config.onParsingError(`no root node found for file id - ${database_store_1.DatabaseStore.fileId}!`);
                }
            }
            yield database_store_1.DatabaseStore.updateFile(database_store_1.DatabaseStore.fileId, { root_node: this._rootNode });
            this._nodes = [];
            this._processNodes(database_store_1.DatabaseStore.config.bucketSize - 50);
        });
    }
    _getRootNode() {
        let smallestIndex = 9999999;
        Object.keys(this._tags).forEach((tagName) => {
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
    _processNodes(limit = 10, skip = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // paginated response using limit and count
                let response;
                response = yield database_store_1.DatabaseStore.getChunks(database_store_1.DatabaseStore.fileId, limit, skip);
                // check if no response, stop processing and save tags here
                if (!response || !response.chunks || !response.chunks.length) {
                    if (this._nodes && this._nodes.length) {
                        let nodeCount = yield database_store_1.DatabaseStore.addNodes(database_store_1.DatabaseStore.fileId, this._nodes);
                        if (!!database_store_1.DatabaseStore.config.onNodesParsed && typeof database_store_1.DatabaseStore.config.onNodesParsed === "function") {
                            database_store_1.DatabaseStore.config.onNodesParsed(nodeCount);
                        }
                    }
                    if (database_store_1.DatabaseStore.config.onNodeParsingSuccess && typeof database_store_1.DatabaseStore.config.onNodeParsingSuccess === "function") {
                        database_store_1.DatabaseStore.config.onNodeParsingSuccess();
                    }
                    if (this._parsingSuccessCallback && typeof this._parsingSuccessCallback === "function") {
                        this._parsingSuccessCallback();
                    }
                    return;
                }
                let chunkText = response.chunks.reduce((chunkString, chunkObj, index) => {
                    return chunkString + chunkObj.chunk;
                }, this._remainingChunkText);
                this._remainingChunkText = "";
                yield this._parseNodes(chunkText);
                this._processNodes(database_store_1.DatabaseStore.config.bucketSize, skip + limit);
            }
            catch (error) {
                console.error(error);
                if (database_store_1.DatabaseStore.config.onParsingError && typeof database_store_1.DatabaseStore.config.onParsingError === "function") {
                    database_store_1.DatabaseStore.config.onParsingError(error);
                }
            }
        });
    }
    _parseNodes(chunkText) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._nodes.length === database_store_1.DatabaseStore.config.bucketSize - 50) {
                let nodeCount = yield database_store_1.DatabaseStore.addNodes(database_store_1.DatabaseStore.fileId, this._nodes);
                if (!!database_store_1.DatabaseStore.config.onNodesParsed && typeof database_store_1.DatabaseStore.config.onNodesParsed === "function") {
                    database_store_1.DatabaseStore.config.onNodesParsed(nodeCount);
                }
                this._nodes = [];
            }
            if (!chunkText) {
                this._remainingChunkText = "";
                return;
            }
            const nodeMatcher = new RegExp(`<${this._rootNode}( |>)`);
            let startIndex = chunkText.search(nodeMatcher);
            let endIndex = chunkText.indexOf(`</${this._rootNode}>`);
            if (startIndex < 0 || endIndex < 0) {
                this._remainingChunkText = chunkText;
                return;
            }
            endIndex += 3 + this._rootNode.length;
            let node = chunkText.substring(startIndex, endIndex);
            if (!node) {
                this._remainingChunkText = chunkText;
                return;
            }
            let xmlNode;
            try {
                xmlNode = yield this.xml2jsparser(node);
                xmlNode = xmlNode[this._rootNode];
                this._nodes.push(xmlNode);
            }
            catch (error) {
                if (database_store_1.DatabaseStore.config.onParsingError && typeof database_store_1.DatabaseStore.config.onParsingError === "function") {
                    database_store_1.DatabaseStore.config.onParsingError({ node: node, error: error, message: "invalid XML node found! Check error for details." });
                }
            }
            chunkText = chunkText.slice(endIndex);
            return yield this._parseNodes(chunkText);
        });
    }
    // converts callback to promise
    xml2jsparser(node) {
        return new Promise((resolve, reject) => {
            xml2js_1.parseString(node, {
                attrkey: "__attributes",
                explicitArray: false,
                emptyTag: true
            }, (error, xmlNode) => {
                if (error) {
                    return reject(error);
                }
                return resolve(xmlNode);
            });
        });
    }
}
exports.NodeParser = NodeParser;
//# sourceMappingURL=node.parser.js.map