/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions */
(function(root) {
    "use strict";

    root = root || {};

    //
    // Helper functions
    //
    var fs, path;
    if (typeof require === "function") {
        fs = require("fs");
        path = require("path");
    }

    var msgpack = root.msgpack5 ? root.msgpack5() : require("msgpack5")();

    var pako = root.pako ? root.pako : require("pako");

    /**
     * Gets the list of test file names
     *
     * @returns {string[]} List of test file names
     */
    function getFiles() {
        //
        // Imports
        //
        if (fs) {
            // Files from the file system (NodeJS)
            return fs.readdirSync(path.join(__dirname, "data"));
        } else {
            // Files from a global TEST_DATA (browser)
            var files = [];

            for (var file in window.TEST_DATA) {
                if (window.TEST_DATA.hasOwnProperty(file)) {
                    files.push(file);
                }
            }

            files.sort();

            return files;
        }
    }

    /**
     * Gets the specified file's contents
     *
     * @param {string} name File name
     *
     * @returns {object} File's contents
     */
    function getFile(name) {
        if (fs) {
            // Read from the file system (NodeJS)
            var data = fs.readFileSync(path.join(__dirname, "data", name), "utf8");
            return JSON.parse(data);
        } else {
            return window.TEST_DATA[name];
        }
    }

    //
    // Run in either Mocha, Karma or Browser environments
    //
    if (typeof root === "undefined") {
        root = {};
    }

    var UserTimingCompression = root.UserTimingCompression ?
        root.UserTimingCompression :
        require("../dist/usertiming-compression");

    var UserTimingDecompression = root.UserTimingDecompression ?
        root.UserTimingDecompression :
        require("../dist/usertiming-decompression");

    var chai = root.chai ? root.chai : require("chai");
    var expect = chai.expect;

    // load all of the test data files
    var testFiles = getFiles();

    //
    // UserTimingCompression
    //
    describe("UserTimingCompression examples", function() {
        for (var i = 0; i < testFiles.length; i++) {
            var testFile = testFiles[i];

            describe(testFile.replace(".json", ""), function() {
                it("Should parse OK", (function(n) {
                    return function() {
                        var data = getFile(testFiles[n]);

                        expect(data).to.exist;
                        expect(data).to.have.property("compressed");
                        expect(data).to.have.property("uri");
                        expect(data).to.have.property("entries");
                    };
                }(i)));

                it("Should compress timestamps as expected", (function(n) {
                    return function() {
                        var data = getFile(testFiles[n]);

                        var entries = data.entries;

                        var compressed = UserTimingCompression.compressUserTiming(entries);

                        expect(compressed).to.deep.equal(data.compressed);
                    };
                }(i)));

                it("Should compress to an URI as expected", (function(n) {
                    return function() {
                        var data = getFile(testFiles[n]);

                        var entries = data.entries;

                        var options = {};
                        if (data.map) {
                            options.map = data.map;
                        }

                        var compressed = UserTimingCompression.compressUserTiming(entries, options);

                        var compressedForUri = UserTimingCompression.compressForUri(compressed);
                        expect(encodeURIComponent(compressedForUri)).to.deep.equal(data.uri);
                    };
                }(i)));

                it("Should compress the full form better than MessagePack", (function(n) {
                    return function() {
                        var data = getFile(testFiles[n]);

                        var entries = data.entries;

                        var options = {};
                        if (data.map) {
                            options.map = data.map;
                        }

                        var compressed = UserTimingCompression.compressUserTiming(entries, options);
                        var compressedForUri = UserTimingCompression.compressForUri(compressed);
                        var enc = encodeURIComponent(compressedForUri);

                        var pack = msgpack.encode(entries);

                        // debugging:
                        // console.log(compressed);
                        // console.log(enc);
                        // console.log(pack.toString());

                        expect(pack.length).to.be.at.least(enc.length);
                    };
                }(i)));

                it("Should compress the minified form better than MessagePack", (function(n) {
                    return function() {
                        var data = getFile(testFiles[n]);

                        if (typeof data.msgpack === "boolean" && !data.msgpack) {
                            // this is a case that msgpack wins
                            return;
                        }

                        var entries = data.entries;

                        var options = {};
                        if (data.map) {
                            options.map = data.map;
                        }

                        var compressed = UserTimingCompression.compressUserTiming(entries, options);
                        var compressedForUri = UserTimingCompression.compressForUri(compressed);
                        var enc = encodeURIComponent(compressedForUri);

                        var pack = msgpack.encode(compressed);

                        // debugging:
                        // console.log(compressed);
                        // console.log(enc);
                        // console.log(pack.toString());

                        expect(pack.length).to.be.at.least(enc.length);
                    };
                }(i)));

                it("Should compress the full form better than zlib", (function(n) {
                    return function() {
                        var data = getFile(testFiles[n]);

                        var entries = data.entries;

                        var options = {};
                        if (data.map) {
                            options.map = data.map;
                        }

                        var compressed = UserTimingCompression.compressUserTiming(entries, options);
                        var compressedForUri = UserTimingCompression.compressForUri(compressed);
                        var enc = encodeURIComponent(compressedForUri);

                        var zlib = pako.deflate(JSON.stringify(entries));

                        // debugging:
                        // console.log(compressed);
                        // console.log(enc);
                        // console.log(enc.length);
                        // console.log(zlib);
                        // console.log(zlib.length);

                        expect(zlib.length).to.be.at.least(enc.length);
                    };
                }(i)));

                it("Should compress the minified form better than zlib", (function(n) {
                    return function() {
                        var data = getFile(testFiles[n]);

                        if (typeof data.zlib === "boolean" && !data.zlib) {
                            // this is a case that msgpack wins
                            return;
                        }

                        var entries = data.entries;

                        var options = {};
                        if (data.map) {
                            options.map = data.map;
                        }

                        var compressed = UserTimingCompression.compressUserTiming(entries, options);
                        var compressedForUri = UserTimingCompression.compressForUri(compressed);
                        var enc = encodeURIComponent(compressedForUri);

                        var zlib = pako.deflate(JSON.stringify(compressed));

                        // debugging:
                        // console.log(compressed);
                        // console.log(enc);
                        // console.log(enc.length);
                        // console.log(zlib);
                        // console.log(zlib.length);

                        expect(zlib.length).to.be.at.least(enc.length);
                    };
                }(i)));

                it("Should decompress from the URI-encoded string to the UserTiming form", (function(n) {
                    return function() {
                        var data = getFile(testFiles[n]);

                        var options = {};
                        if (data.map) {
                            options.map = data.map;
                        }

                        var decodedUri = decodeURIComponent(data.uri);
                        var decoded = UserTimingDecompression.decompressUserTiming(decodedUri, options);

                        // sort entries first
                        var entries = data.entries;

                        entries.sort(function(a, b) {
                            if (a.startTime !== b.startTime) {
                                return a.startTime - b.startTime;
                            } else {
                                return a.duration - b.duration;
                            }
                        });

                        // trim all entries to milliseconds since that's lost
                        for (var j = 0; j < entries.length; j++) {
                            entries[j].startTime = Math.round(entries[j].startTime);
                            entries[j].duration = Math.round(entries[j].duration);
                        }

                        expect(decoded).to.deep.equal(entries);
                    };
                }(i)));
            });
        }
    });
}(typeof window !== "undefined" ? window : undefined));
