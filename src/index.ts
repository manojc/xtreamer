import { Xtreamer } from "./xtreamer";
import { XtreamerConfig } from "./xtreamer.config";

export function initXtreamer(fileUrl:string, config: XtreamerConfig): Xtreamer {
    return new Xtreamer().init(fileUrl, config);
}