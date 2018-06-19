import { Schema, model, Model, Document } from "mongoose";

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

export const ChunkSchemaInstance = (collectionName: string = "xtreamer.chunks") : Model<Document> => {
    collectionName = collectionName && collectionName.trim() || "xtreamer.chunks";
    return model("XtreamerChunk", XtreamerChunkSchema, collectionName);
}