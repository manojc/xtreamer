"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const xtreamer_config_1 = require("../xtreamer.config");
const XtreamerChunkSchema = new mongoose_1.Schema({
    file_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "",
        required: [true, "file id foreign key is required!"]
    },
    chunk: {
        type: mongoose_1.Schema.Types.String,
        required: [true, "file chunk value is required!"],
        validate: {
            validator: (value) => {
                return !!value && typeof value === "string" && !!value.trim();
            },
            message: "chunk can not be null or empty"
        }
    }
}, { timestamps: true });
exports.ChunkSchemaInstance = (fileId, collectionName = xtreamer_config_1.CHUNK_COLLECTION_PREFIX) => {
    if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
        throw "file id is required to create an instance of xtreamer chunk collection!";
        return null;
    }
    collectionName = collectionName && collectionName.trim() ? collectionName : xtreamer_config_1.CHUNK_COLLECTION_PREFIX;
    return mongoose_1.model("XtreamerChunk", XtreamerChunkSchema, `${collectionName}_${fileId}`);
};
//# sourceMappingURL=chunk.schema.js.map