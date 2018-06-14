import { createServer, IncomingMessage, ServerResponse, Server } from "http";
import { readFileSync } from "fs";
import { join } from "path";

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
        } else if (request.url.indexOf('/public') > -1) {
            return response.end(readFileSync(join(__dirname, `..${request.url}`)));
        } else if (request.url.indexOf('/api') > -1) {
            response.setHeader('Content-Type', "application/json");
            return response.end(JSON.stringify({
                Name: "Manoj Chalode"
            }));
        } else {
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
}