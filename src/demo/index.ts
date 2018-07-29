import { Xtreamer } from "../index";
import { XtreamerConfig } from "../streamer/streamer.config";
import { FILES } from "./files";

let chunkCount = 0;

function onChunkProcesed(chunkIds: Array<string>): void {
    let currentCount: number = chunkIds.length;
    chunkCount += currentCount;
    console.log(`total chunks processed ${chunkCount}`);
}

function onStreamingSuccess(fileId: string): void {
    console.log(`file streaming finished - ${fileId}`);
}

function onStreamingError(error: any): void {
    console.error(`error occurred!!`, error);
}

function onChunkParsingSuccess(): void {
    console.log(`chunk parsing finished!`);
}

function onNodeParsingSuccess(): void {
    console.log(`node parsing finished!`);
}

function onParsingError(error: any): void {
    console.error(`error occurred!!`, error);
}

function onDatabaseConnectionSuccess(): void {
    console.log("database connected!!!");
}

function onDatabaseConnectionError(error: any) {
    console.error("database connection error!!", error);
}

(() => {
    let config: XtreamerConfig = {
        dbUrl: "mongodb://localhost",
        chunksReused: 2,
        onDatabaseConnectionSuccess: onDatabaseConnectionSuccess,
        onDatabaseConnectionError: onDatabaseConnectionError,
        onChunksProcesed: onChunkProcesed,
        onStreamingSuccess: onStreamingSuccess,
        onStreamingError: onStreamingError,
        onChunkParsingSuccess: onChunkParsingSuccess,
        onNodeParsingSuccess: onNodeParsingSuccess,
        onParsingError: onParsingError
    };
    new Xtreamer().
        init(FILES.url109Mb, config)
        .then(() => console.log(`streaming started!`))
        .catch((error: any) => console.error(error));
})();