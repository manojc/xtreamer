import { Xtreamer } from "../index";
import { XtreamerConfig } from "../streamer/streamer.config";
import { FILES } from "./files";

let count = 0;

function onChunkProcesed(chunkCount: number): void {
    count += chunkCount;
    console.log(`total chunks processed ${count}`);
}

function onChunksParsed(chunkCount: number): void {
    count += chunkCount;
    if (count % 1000 === 0) {
        console.log(`total chunks parsed ${count}`);
    }
}

function onNodesParsed(nodeCount: number): void {
    count += nodeCount;
    if (count % 1000 === 0) {
        console.log(`total nodes parsed ${count}`);
    }
}

function onStreamingSuccess(fileId: string): void {
    console.log(`file streaming finished - ${fileId}`);
    console.log(`starting chunk parsing...`);
}

function onStreamingError(error: any): void {
    console.error(`error occurred!!`, error);
}

function onChunkParsingSuccess(): void {
    count = 0;
    console.log(`chunk parsing finished!`);
    console.log(`starting node parsing...`);
}

function onNodeParsingSuccess(): void {
    count = 0;
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
    new Xtreamer().
        init(FILES.url82Mb, config)
        .then(() => console.log(`streaming started!`))
        .catch((error: any) => console.error(error));
})();