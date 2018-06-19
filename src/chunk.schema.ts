import { Schema, model, Model, Document } from "mongoose";
import { CHUNK_COLLECTION_PREFIX } from "./streamer.config";

const XtreamerChunkSchema = new Schema({
    file_id: {
        type: Schema.Types.ObjectId,
        ref: "",
        required: [true, "file id foreign key is required!"]
    },
    chunk: {
        type: Schema.Types.String,
        required: [true, "file chunk value is required!"],
        validate: {
            validator: (value: string): boolean => {
                return !!value && typeof value === "string" && !!value.trim();
            },
            message: "chunk can not be null or empty"
        }
    }
}, { timestamps: true });

export const ChunkSchemaInstance = (fileId: string, collectionName: string = CHUNK_COLLECTION_PREFIX) : Model<Document> => {

    if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
        throw "file id si required to create a xtreamer chunk collection instance!";
        return null;
    }

    collectionName = collectionName && collectionName.trim() || CHUNK_COLLECTION_PREFIX;
    return model("XtreamerChunk", XtreamerChunkSchema, `${collectionName}.${fileId}`);
}