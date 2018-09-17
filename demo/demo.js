const request = require("request");
const xtreamer = require("../lib/index");

// 23 MB File
const node = "dataset";
const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";

// 680 MB File
// const node = "ProteinEntry";
// const url = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/pir/psd7003.xml";

let count = 0;

const xtreamerTransform = xtreamer(node)
    .on("data", () => ++count % 100 || console.log(count))
    .on("end", () => console.log(count))
    .on("error", (error) => console.error(error));

request.get(url).pipe(xtreamerTransform);