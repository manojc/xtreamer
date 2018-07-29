import { Schema, model, Model, Document } from "mongoose";
import { NODES_COLLECTION_PREFIX } from "../streamer/streamer.config";

const XtreamerNodeSchema = new Schema({
    file_id: {
        type: Schema.Types.ObjectId,
        ref: "",
        required: [true, "file id foreign key is required!"]
    },
    node: {
        type: Schema.Types.Mixed,
        required: [true, "file node value is required!"],
        validate: {
            validator: (value: any): boolean => {
                return !!value;
            },
            message: "node can not be null"
        }
    }
}, { timestamps: true });

export const NodeSchemaInstance = (fileId: string, collectionName: string = NODES_COLLECTION_PREFIX) : Model<Document> => {

    if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
        throw "file id is required to create an instance of xtreamer node collection!";
        return null;
    }

    collectionName = collectionName && collectionName.trim() ? collectionName : NODES_COLLECTION_PREFIX;
    return model("XtreamerNode", XtreamerNodeSchema, `${collectionName}_${fileId}`);
}