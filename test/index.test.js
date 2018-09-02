const request = require("request");
const Assert = require("chai").assert;
const xtreamer = require("../lib/index");
const { Constants } = require("../lib/util");

describe("Xtreamer Tests", () => {

    before(function (done) {
        this.timeout(25000);
        done();
    })

    it("should throw error for empty node", function (done) {
        try {
            const xtream = xtreamer("");
        } catch (error) {
            done();
        }
    });

    it("should return 0 records for invalid node in small XML file (< 10 Mb)", function (done) {
        let count = 0;
        request.get("https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/2mb.xml")
            .on("end", () => {
                Assert.strictEqual(count, 0);
                done();
            })
            .pipe(xtreamer("invalid-node")
                .on(Constants.XML_DATA, (data) => {
                    ++count;
                })
            );
    });

    it("should trigger error event for invalid node in large XML file (> 10 Mb)", function (done) {
        request.get("https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml")
            .pipe(xtreamer("invalid-node")
                .on("error", (error) => {
                    done();
                })
            );
    });

    it("should be able to parse small xml files (< 10 Mb)", function (done) {
        let count = 0;
        request.get("https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/2mb.xml")
            .on("end", () => {
                Assert.strictEqual(count, 2112);
                done();
            })
            .pipe(xtreamer("course_listing")
                .on(Constants.XML_DATA, (data) => {
                    ++count
                })
            );
    });

    it("should be able to parse large xml files (> 10 Mb)", function (done) {
        let count = 0;
        request.get("https://raw.githubusercontent.com/manojc/xtagger/gh-pages/demo/23mb.xml")
            .on("end", () => {
                Assert.strictEqual(count, 2435);
                done();
            })
            .pipe(xtreamer("dataset")
                .on(Constants.XML_DATA, (data) => {
                    ++count
                })
            );
    });

});