const request = require("request");
const Xtreamer = require("../lib/index");

const url = "http://aiweb.cs.washington.edu/research/projects/xmltk/xmldata/data/pir/psd7003.xml";
let count = 0;

request.get(url).pipe(Xtreamer("ProteinEntry"))
    .on("xmldata", (data) => {
        if (++count % 1000 === 0) {
            console.log(count);
        }
    })
    .on("end", (data) => { console.log(count); })
    .on("close", () => { })
    .on("error", (error) => { });