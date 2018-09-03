const fs = require("fs");
const request = require("request");
const xtreamer = require("../lib/index");

// ProteinEntry
// const url = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/pir/psd7003.xml";

const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";
let count = 0;

const readStream = request.get(url)
    .on("end", (data) => console.log(count))
    .on("close", () => { })
    .on("error", (error) => { });

const xtreamerTransform = xtreamer("dataset")
    .on("xmldata", (data) => ++count);

readStream.pipe(xtreamerTransform);