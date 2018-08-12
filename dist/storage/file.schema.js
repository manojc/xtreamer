"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const xtreamer_config_1 = require("../xtreamer.config");
const XtreamerFileSchema = new mongoose_1.Schema({
    url: {
        type: mongoose_1.Schema.Types.String,
        required: [true, "URL is required"],
        validate: {
            validator: (value) => {
                return !!value && typeof value === "string" && !!value.trim();
            },
            message: "URL should be a valid string!"
        },
    },
    file_size: {
        type: mongoose_1.Schema.Types.Number,
        default: 0,
        validate: {
            validator: (value) => {
                return (!!value || value === 0) && typeof value === "number" && !isNaN(value);
            },
            message: "file_size should be a valid number!"
        },
    },
    is_processed: {
        type: mongoose_1.Schema.Types.Boolean,
        default: false
    },
    root_node: {
        type: mongoose_1.Schema.Types.String
    },
    structure: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null
    }
}, { timestamps: true });
exports.FileSchemaInstance = (collectionName = xtreamer_config_1.FILE_COLLECTION_NAME) => {
    collectionName = collectionName && collectionName.trim() ? collectionName : xtreamer_config_1.FILE_COLLECTION_NAME;
    return mongoose_1.model("XtreamerFile", XtreamerFileSchema, collectionName);
};
//# sourceMappingURL=file.schema.js.map