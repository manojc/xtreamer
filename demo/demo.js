const fs = require("fs");
const request = require("request");
const Xtreamer = require("../lib/index");

// ProteinEntry
// const url = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/pir/psd7003.xml";

const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";
let count = 0;

const streamer = Xtreamer("dataset")
    .on("xmldata", (data) => ++count);

request.get(url)
    .on("end", (data) => console.log(count))
    .on("close", () => { })
    .on("error", (error) => { })
    .pipe(streamer);