import { Xstreamer } from "../index";
import { XtreamerConfig } from "../streamer.config";

let chunkCount = 0;

function onChunkProcesed(chunkId: string): void {
    let  currentCount: number = chunkId.split(',').length;
    chunkCount += currentCount;
    console.log(`total chunks processed ${chunkCount}`);
}

function onSuccess(fileId: string): void {
    console.log(`file streaming finished ${fileId}`);
}

function onError(error: any): void {
    console.error(`error occurred!!`, error);
}

function connectCallback(): void {
    console.log("database connected!!!");
}

(() => {
    const url: string = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/pir/psd7003.xml";
    let config: XtreamerConfig = {
        dbUrl: "mongodb://localhost",
        connectCallback: connectCallback,
        onChunkProcesed: onChunkProcesed,
        onError: onError,
        onSuccess: onSuccess
    }
    let streamer: Xstreamer = new Xstreamer();
    streamer.stream(url, config);
})();