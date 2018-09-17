const request = require("request");
const Assert = require("chai").assert;
const xtreamer = require("../lib/index");
const { Constants } = require("../lib/util");

describe("Xtreamer Tests", () => {

    it("should throw error for empty node", function (done) {
        this.timeout(25000);
        try {
            const xtream = xtreamer("");
        } catch (error) {
            done();
        }
    });

    it("should return 0 records for invalid node in small XML file (< 10 Mb)", function (done) {
        this.timeout(25000);
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/2mb.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("invalid-node")
            .on("data", (data) => { ++count; })
            .on("end", () => { Assert.strictEqual(count, 0); done(); });
        request.get(url).pipe(xtreamerTransform);
    });

    it("should trigger error event for invalid node in large XML file (> 10 Mb)", function (done) {
        this.timeout(25000);
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";
        const xtreamerTransform = xtreamer("invalid-node")
            .on("error", (error) => done());
        request.get(url).pipe(xtreamerTransform);
    });

    it("should be able to parse files with large xml nodes with increased max_xml_size", function (done) {
        this.timeout(25000);
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/12.5.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("datasets", { max_xml_size: 30000000 })
            .on("data", data => ++count)
            .on("end", () => { Assert.strictEqual(count, 1); done(); });
        request.get(url).pipe(xtreamerTransform);
    });

    it("should be able to parse small xml files (< 10 Mb)", function (done) {
        this.timeout(25000);
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/2mb.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("course_listing")
            .on("data", data => ++count)
            .on("end", () => { Assert.strictEqual(count, 2112); done(); });
        request.get(url).pipe(xtreamerTransform);
    });

    it("should be able to parse large xml files (> 10 Mb)", function (done) {
        this.timeout(25000);
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("dataset")
            .on("data", data => ++count)
            .on("end", () => { Assert.strictEqual(count, 2435); done(); });
        request.get(url).pipe(xtreamerTransform);
    });

    it("should emit data event for every xml node", function (done) {
        this.timeout(25000);
        const url = "https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml";
        let count = 0;
        const xtreamerTransform = xtreamer("dataset")
            .on("data", data => ++count)
            .on("end", () => { Assert.strictEqual(count, 2435); done(); });
        request.get(url).pipe(xtreamerTransform);
    });
});