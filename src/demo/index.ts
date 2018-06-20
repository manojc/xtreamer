import { Xstreamer } from "../index";
import { XtreamerConfig } from "../streamer.config";

let chunkCount = 0;

function onChunkProcesed(chunkIds: Array<string>): void {
    let  currentCount: number = chunkIds.length;
    chunkCount += currentCount;
    console.log(`total chunks processed ${chunkCount}`);
}

function onStreamingSuccess(fileId: string): void {
    console.log(`file streaming finished ${fileId}`);
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

function onDatabaseConnection(): void {
    console.log("database connected!!!");
}

(() => {
    const url: string = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/nasa/nasa.xml";
    let config: XtreamerConfig = {
        dbUrl: "mongodb://localhost",
        onDatabaseConnection: onDatabaseConnection,
        onChunkProcesed: onChunkProcesed,
        onStreamingError: onStreamingError,
        onStreamingSuccess: onStreamingSuccess,
        onParsingSuccess: onParsingSuccess,
        onParsingError: onParsingError
    }
    let streamer: Xstreamer = new Xstreamer();
    streamer.stream(url, config)
        .catch((error: any) => console.error(error));
})();