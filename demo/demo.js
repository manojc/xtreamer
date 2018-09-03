const fs = require("fs");
const request = require("request");
const xtreamer = require("../lib/index");

// 23 MB File
const node = "dataset";
const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";

// 680 MB File
// const node = "ProteinEntry";
// const url = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/pir/psd7003.xml";

let count = 0;

const readStream = request.get(url)
    .on("end", (data) => console.log(count))
    .on("close", () => { })
    .on("error", (error) => console.error(error));

const xtreamerTransform = xtreamer(node)
    .on("xmldata", (data) => ++count)
    .on("error", (error) => console.error(error));

readStream.pipe(xtreamerTransform);