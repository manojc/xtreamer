"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xtreamer_1 = require("./xtreamer");
const xtreamer_config_1 = require("./xtreamer.config");
exports.XtreamerConfig = new xtreamer_config_1.XtreamerConfig();
function initXtreamer(fileUrl, config) {
    return new xtreamer_1.Xtreamer().init(fileUrl, config);
}
exports.initXtreamer = initXtreamer;
//# sourceMappingURL=index.js.map