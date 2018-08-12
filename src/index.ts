import { Xtreamer } from "./xtreamer";
import { XtreamerConfig as Config } from "./xtreamer.config";

export const XtreamerConfig: Config = new Config();

export function initXtreamer(fileUrl: string, config: Config): Xtreamer {
    return new Xtreamer().init(fileUrl, config);
}