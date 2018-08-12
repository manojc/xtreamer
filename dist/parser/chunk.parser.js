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
const database_store_1 = require("../storage/database.store");
const parser_model_1 = require("./parser.model");
class ChunkParser {
    constructor(parsingSuccessCallback) {
        this._hierarchy = 0;
        this._parsingSuccessCallback = parsingSuccessCallback;
    }
    parse() {
        this._tags = new parser_model_1.Tags();
        this._indexToStartFrom = 0;
        this._hierarchy = 0;
        this._processChunks(database_store_1.DatabaseStore.config.bucketSize - 50);
    }
    _processChunks(limit = 10, skip = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let response;
                response = yield database_store_1.DatabaseStore.getChunks(database_store_1.DatabaseStore.fileId, limit, skip);
                if (!response || !response.chunks || !response.chunks.length) {
                    yield database_store_1.DatabaseStore.updateFile(database_store_1.DatabaseStore.fileId, {
                        structure: this._tags
                    });
                    return this._onParsingSuccess();
                }
                let lastChunkStartIndex = 0;
                let chunkText = response.chunks.reduce((chunkString, chunkObj, index) => {
                    if (response.chunks.length - database_store_1.DatabaseStore.config.chunkOffset === index) {
                        lastChunkStartIndex = chunkString.length;
                    }
                    chunkString += chunkObj.chunk;
                    return chunkString;
                }, "");
                this._tags = this._parseTags(chunkText, lastChunkStartIndex, skip + limit >= response.count);
                if (database_store_1.DatabaseStore.config.onChunksParsed && typeof database_store_1.DatabaseStore.config.onChunksParsed === "function") {
                    database_store_1.DatabaseStore.config.onChunksParsed(response.chunks.length);
                }
                this._processChunks(limit, skip + limit - database_store_1.DatabaseStore.config.chunkOffset);
            }
            catch (error) {
                if (database_store_1.DatabaseStore.config.onParsingError && typeof database_store_1.DatabaseStore.config.onParsingError === "function") {
                    database_store_1.DatabaseStore.config.onParsingError(error);
                }
            }
        });
    }
    _parseTags(chunkText, lastChunkStartIndex, isLastIteration) {
        let openingTagOpeningBracketIndex = -1;
        let closingTagOpeningBracketIndex = 0;
        let isCData = false;
        let isComment = false;
        let exitLoop = false;
        return chunkText.split('').reduce((tags, currentChar, index, array) => {
            if (this._indexToStartFrom > index || (exitLoop && !isLastIteration)) {
                return tags;
            }
            else if (currentChar === "<" && array[index + 1] === '!' && array[index + 2] === '[') {
                isCData = true;
            }
            else if (currentChar === ">" && array[index - 1] === ']' && array[index - 2] === ']') {
                isCData = false;
            }
            else if (currentChar === "<" && array[index + 1] === '!' && array[index + 2] === '-' && array[index + 3] === '-') {
                isComment = true;
            }
            else if (currentChar === ">" && array[index - 1] === '-' && array[index - 2] === '-') {
                isComment = false;
            }
            if (isCData || isComment) {
                return tags;
            }
            else if (currentChar === "<" && array[index + 1] === '/') {
                closingTagOpeningBracketIndex = index;
                openingTagOpeningBracketIndex = -1;
            }
            else if (currentChar === "<" && array[index + 1] !== '/') {
                openingTagOpeningBracketIndex = index;
                closingTagOpeningBracketIndex = 0;
            }
            else if ((currentChar === ">" || currentChar === " ") && openingTagOpeningBracketIndex >= 0) {
                let name = chunkText.substring(openingTagOpeningBracketIndex + 1, index);
                let emptyTag = name[name.length - 1] === "/";
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
                let name = chunkText.substring(closingTagOpeningBracketIndex + 2, index);
                let currentDistance = (closingTagOpeningBracketIndex - 1) - tags[name].end;
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
    _onParsingSuccess() {
        if (database_store_1.DatabaseStore.config.onChunkParsingSuccess && typeof database_store_1.DatabaseStore.config.onChunkParsingSuccess === "function") {
            database_store_1.DatabaseStore.config.onChunkParsingSuccess();
        }
        if (this._parsingSuccessCallback && typeof this._parsingSuccessCallback === "function") {
            this._parsingSuccessCallback();
        }
    }
}
exports.ChunkParser = ChunkParser;
//# sourceMappingURL=chunk.parser.js.map