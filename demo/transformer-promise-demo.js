const request = require("request");
const xtreamer = require("../lib/index");
const { transformerPromise } = require("../test/transformer");

// 23 MB File
// const node = "dataset";
// const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";

// 680 MB File
const node = "ProteinEntry";
const url = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/pir/psd7003.xml";

let count = 0;
console.time("xtreamer");
const xtreamerTransform = xtreamer(node, { transformer: transformerPromise })
    .on("data", (xmlNode) => ++count % 1000 || console.log(count))
    .on("end", () => { console.log(`\n\nNodes processed - ${count}\nProcessing time - `); console.timeEnd("xtreamer"); })
    .on("error", (error) => console.error(error));

request.get(url).pipe(xtreamerTransform);