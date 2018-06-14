import { createReadStream, ReadStream } from "fs";
import { Config } from "./config.model";

export namespace Xtreamer {

    const BUFFER_SIZE: number = 100;

    export function readFile(config: Config): void {

        if (!validateConfig(config)) {
            return;
        }

        const stream: ReadStream = createReadStream(config.url, {
            flags: "r",
            encoding: "utf8",
            start: 0,
            end: config.batchSize || BUFFER_SIZE
        });

        stream.on('data', (data: any) => {
            stream.destroy();
            config.onDataCallBack(null, data);
        });

        stream.on('close', () => {
            config.onEndCallBack(null);
        });

        stream.on('error', (error: any) => {
            config.onErrorCallBack(error);
        });
    }

    function validateConfig(Config: Config): boolean {
        return true;
    }
}