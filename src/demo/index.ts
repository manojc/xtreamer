import { Xtreamer } from "../index";
import { XtreamerConfig } from "../streamer/streamer.config";

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

function onParsingSuccess(): void {
    console.log(`file parsing finished!`);
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
    // const url: string = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/pir/psd7003.xml";
    const url: string = "https://www.sevenoakssoundandvision.co.uk/feeds/whfdetails.xml";
    let config: XtreamerConfig = {
        dbUrl: "mongodb://localhost",
        onDatabaseConnectionSuccess: onDatabaseConnectionSuccess,
        onDatabaseConnectionError: onDatabaseConnectionError,
        onChunksProcesed: onChunkProcesed,
        onStreamingSuccess: onStreamingSuccess,
        onStreamingError: onStreamingError,
        onParsingSuccess: onParsingSuccess,
        onParsingError: onParsingError
    };
    new Xtreamer().
        init(url, config)
        .then(() => console.log(`streaming started!`))
        .catch((error: any) => console.error(error));
})();