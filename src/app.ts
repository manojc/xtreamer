import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { readFileSync, createWriteStream, WriteStream } from "fs";
import { join, basename, resolve } from "path";
import { Xtreamer } from "./index";
import { Config } from "./config.model";

export namespace App {

    let app: Server;

    export function connect(port?: number, callback?: (error: any) => void): Server {
        app = createServer(onRequest);
        app.listen(process.env.PORT || 3000, onListen);
        return app;
    }

    function onRequest(request: IncomingMessage, response: ServerResponse): void {
        if (request.url === "/") {
            return response.end(readFileSync(join(__dirname, '../public/index.html')));
        }
        else if (request.url === "/favicon.ico") {
            return response.end(readFileSync(join(__dirname, '../public/favicon.ico')));
        }
        else if (request.url.indexOf('/public') > -1) {
            return response.end(readFileSync(join(__dirname, `..${request.url}`)));
        }
        else if (request.url.indexOf('/api/') > -1) {
            response.statusCode = 200;
            return response.end(downloadFile(request, response));
        }
        else {
            response.setHeader('Content-Type', "application/json");
            response.statusCode = 404;
            response.write(null);
        }
    }

    function onListen(error: any) {
        if (!!error) {
            console.error(`Server faield to listen to port ${process.env.PORT || 3000}`, error);
        }
        console.log(`Server listening to port ${process.env.PORT || 3000}`);
    }

    function downloadFile(request: IncomingMessage, response: ServerResponse): void {
        let fileUrl = request.url.split('/api/')[1];
        let file: string = basename(`../files/${fileUrl}-${new Date().getTime()}`);
        file = resolve(__dirname, `../files/${fileUrl}-${new Date().getTime()}`);
        let writer: WriteStream = createWriteStream(file);
        let config: Config = new Config(decodeURIComponent(fileUrl));
        Xtreamer.readFile(config).pipe(writer);
        config.onDataCallBack = (error: any, data: any): void => {
            if (error) {
                console.log(error);
            }
        }
        config.onErrorCallBack = (error: any): void => {
            if (error) {
                console.log(error);
            }
        }
        config.onEndCallBack = (error: any): void => {
            if (error) {
                console.log(error);
            }
            response.end();
        }
    }
}