const fs = require("fs");
const request = require("request");
const Xtreamer = require("../lib/index");

const options = {
    node: "VehicleRemarketing",
    emitXml: true
}

let count = 0;
// https://github.com/manojc/xtagger/blob/gh-pages/demo/23mb.xml?raw=true
Xtreamer(request.get("http://192.168.1.84:8080/boats.xml"), options)
    .on("xmldata", (data) => {
        if (++count % 1000 === 0) {
            console.log(count);
        }
    })
    .on("end", (data) => {
        console.log(count);
        console.log(data);
    })
    .on("close", () => {
        console.log("stream closed!");
    })
    .on("error", (error) => {
        console.log("error occurred!", error);
    });