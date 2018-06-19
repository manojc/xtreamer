import { connect } from "mongoose";
import { Model, Document } from "mongoose";
import { FileSchemaInstance } from "./file.schema";
import { ChunkSchemaInstance } from "./chunk.schema";
import { XtreamerConfig } from "./streamer.config";
import { ObjectID } from "bson";

class DatabaseStorage {

    private _file: Model<Document>;
    private _chunk: Model<Document>;
    private _config: XtreamerConfig;

    public constructor(config: XtreamerConfig) {
        if (this._validate(config)) {
            this._connect().then(() => this._init());
        }
    }

    private _validate(config: XtreamerConfig): boolean {
        if (!config) {
            throw "xtreamer config nort provided";
        }
        if (!config.dbUrl || !!config.dbUrl.trim()) {
            throw "database URL not provided";
        }
        config.dbName = !!config.dbName && !!config.dbName.trim() ? config.dbName.trim() : "xtreamer.db";
        config.fileCollectionName = !!config.fileCollectionName && !!config.fileCollectionName.trim() ? config.fileCollectionName.trim() : "xstreamer.files";
        config.chunkCollectionName = !!config.chunkCollectionName && !!config.chunkCollectionName.trim() ? config.chunkCollectionName.trim() : "xstreamer.chunks";
        this._config = config;
        return true;
    }

    private _init(): void {
        this._file = FileSchemaInstance(this._config.fileCollectionName);
        this._chunk = ChunkSchemaInstance(this._config.chunkCollectionName);
        if (this._config.connectCallback && typeof this._config.connectCallback === "function") {
            this._config.connectCallback();
        }
    }

    private _connect(): Promise<void> {
        return connect(`${this._config.dbUrl.trim()}/${this._config.dbName.trim()}`)
            .then(() => Promise.resolve())
            .catch((error: any) => { throw `could not connect to ${this._config.dbUrl.trim()}/${this._config.dbName.trim()}`; })
    }

    public addFile(url: string): Promise<string> {
        return this._file.create({ url: url })
            .then((response: any) => Promise.resolve(response._id.toString()))
            .catch((error: any) => Promise.reject(error));
    }

    public removeFile(id: string): Promise<void> {
        return this._file.findByIdAndRemove(new ObjectID(id))
            .then(() => Promise.resolve())
            .catch((error: any) => Promise.reject(error));
    }

    public addChunk(fileId: string, chunk: string): Promise<string> {
        return this._chunk.create({
            file_id: new ObjectID(fileId),
            chunk: chunk
        })
            .then((response: any) => Promise.resolve(response._id.toString()))
            .catch((error: any) => Promise.reject(error));
    }

    public removeChunk(fileId: string): Promise<void> {
        return this._chunk.findOneAndRemove({
            file_id: new ObjectID(fileId)
        })
            .then(() => Promise.resolve())
            .catch((error: any) => Promise.reject(error));
    }

    public removeFileChunks(fileId: string): Promise<void> {
        return this._chunk.remove({
            file_id: new ObjectID(fileId)
        })
            .then(() => Promise.resolve())
            .catch((error: any) => Promise.reject(error));
    }
}

export { DatabaseStorage };