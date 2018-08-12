"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const files_1 = require("./files");
let count = 0;
const config = {
    dbUrl: "mongodb://localhost",
    chunkOffset: 2,
    onDatabaseConnectionSuccess: onDatabaseConnectionSuccess,
    onDatabaseConnectionError: onDatabaseConnectionError,
    onChunksProcesed: onChunkProcesed,
    onChunksParsed: onChunksParsed,
    onNodesParsed: onNodesParsed,
    onStreamingSuccess: onStreamingSuccess,
    onStreamingError: onStreamingError,
    onChunkParsingSuccess: onChunkParsingSuccess,
    onNodeParsingSuccess: onNodeParsingSuccess,
    onParsingError: onParsingError
};
function onChunkProcesed(chunkCount) {
    count += chunkCount;
    console.log(`total chunks processed ${count}`);
}
function onChunksParsed(chunkCount) {
    count += chunkCount;
    if (count % 1000 === 0) {
        console.log(`total chunks parsed ${count}`);
    }
}
function onNodesParsed(nodeCount) {
    count += nodeCount;
    if (count % 1000 === 0) {
        console.log(`total nodes parsed ${count}`);
    }
}
function onStreamingSuccess(fileId) {
    count = 0;
    console.log(`file streaming finished - ${fileId}`);
    console.log(`starting chunk parsing...`);
}
function onStreamingError(error) {
    count = 0;
    console.error(`error occurred!!`, error);
}
function onChunkParsingSuccess() {
    count = 0;
    console.log(`chunk parsing finished!`);
    console.log(`starting node parsing...`);
}
function onNodeParsingSuccess() {
    count = 0;
    console.log(`node parsing finished!`);
}
function onParsingError(error) {
    console.error(`error occurred!!`, error);
}
function onDatabaseConnectionSuccess() {
    console.log("database connected!!!");
}
function onDatabaseConnectionError(error) {
    console.error("database connection error!!", error);
}
(() => {
    const streamer = index_1.initXtreamer(files_1.FILES.URL582Mb, config);
    streamer.start();
})();
//# sourceMappingURL=index.js.map