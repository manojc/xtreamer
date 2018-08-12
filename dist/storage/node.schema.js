"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const xtreamer_config_1 = require("../xtreamer.config");
const XtreamerNodeSchema = new mongoose_1.Schema({
    file_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "",
        required: [true, "file id foreign key is required!"]
    },
    node: {
        type: mongoose_1.Schema.Types.Mixed,
        required: [true, "file node value is required!"],
        validate: {
            validator: (value) => {
                return !!value;
            },
            message: "node can not be null"
        }
    }
}, { timestamps: true });
exports.NodeSchemaInstance = (fileId, collectionName = xtreamer_config_1.NODES_COLLECTION_PREFIX) => {
    if (!fileId || typeof fileId !== "string" || !fileId.trim()) {
        throw "file id is required to create an instance of xtreamer node collection!";
        return null;
    }
    collectionName = collectionName && collectionName.trim() ? collectionName : xtreamer_config_1.NODES_COLLECTION_PREFIX;
    return mongoose_1.model("XtreamerNode", XtreamerNodeSchema, `${collectionName}_${fileId}`);
};
//# sourceMappingURL=node.schema.js.map