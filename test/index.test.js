const fs = require("fs");
const request = require("request");
const Assert = require("chai").assert;
const xtreamer = require("../lib/index");

describe("Xtreamer Tests", () => {

    it("should throw error for empty node", (done) => {
        try { xtreamer(""); } catch (error) { done(); }
    });

    it("should return 0 records for invalid node in small XML file (< 10 Mb)", (done) => {
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/2mb.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("invalid-node")
            .on("data", () => { ++count; })
            .on("end", () => { Assert.strictEqual(count, 0); done(); });
        request.get(url).pipe(xtreamerTransform);
    }).timeout(5000);;

    it("should trigger error event for invalid node in large XML file (> 10 Mb)", (done) => {
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";
        const xtreamerTransform = xtreamer("invalid-node")
            .on("error", () => done());
        request.get(url).pipe(xtreamerTransform);
    }).timeout(50000);

    it("should be able to parse files with large xml nodes with increased max_xml_size", (done) => {
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/12.5.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("datasets", { max_xml_size: 30000000 })
            .on("data", () => ++count)
            .on("end", () => { Assert.strictEqual(count, 1); done(); });
        request.get(url).pipe(xtreamerTransform);
    }).timeout(50000);

    it("should be able to parse small xml files (< 10 Mb)", (done) => {
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/2mb.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("course_listing")
            .on("data", () => ++count)
            .on("end", () => { Assert.strictEqual(count, 2112); done(); });
        request.get(url).pipe(xtreamerTransform);
    }).timeout(5000);;

    it("should be able to parse large xml files (> 10 Mb)", (done) => {
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("dataset")
            .on("data", () => ++count)
            .on("end", () => { Assert.strictEqual(count, 2435); done(); });
        request.get(url).pipe(xtreamerTransform);
    }).timeout(50000);

    it("should emit data event for every xml node", (done) => {
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/2mb.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("course_listing")
            .on("data", () => ++count)
            .on("end", () => { Assert.strictEqual(count, 2112); done(); });
        request.get(url).pipe(xtreamerTransform);
    }).timeout(5000);

    it("should skip the <node> & </node> strings in comments", (done) => {
        const filePath = `${__dirname}/test-comment.xml`;
        let count = 0;
        const xtreamerTransform = xtreamer("item")
            .on("data", () => ++count)
            .on("end", () => { Assert.strictEqual(count, 5); done(); });
        fs.createReadStream(filePath).pipe(xtreamerTransform);
    });

    it("should skip the <node> & </node> strings in cdata", (done) => {
        const filePath = `${__dirname}/test-cdata.xml`;
        let count = 0;
        const xtreamerTransform = xtreamer("item")
            .on("data", () => ++count)
            .on("end", () => { Assert.strictEqual(count, 5); done(); });
        fs.createReadStream(filePath).pipe(xtreamerTransform);
    });
});