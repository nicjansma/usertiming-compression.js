/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions */
(function(root) {
    "use strict";

    //
    // Run in either Mocha, Karma or Browser environments
    //
    if (typeof root === "undefined") {
        root = {};
    }

    var utc = root.UserTimingCompression ?
        root.UserTimingCompression :
        require("../dist/usertiming-compression");

    var chai = root.chai ? root.chai : require("chai");
    var expect = chai.expect;

    //
    // UserTimingCompression
    //
    describe("UserTimingCompression", function() {
        //
        // .trimTiming
        //
        describe(".trimTiming()", function() {
            it("should handle 0", function() {
                expect(utc.trimTiming(0)).to.equal(0);
            });

            it("should handle undefined", function() {
                expect(utc.trimTiming()).to.equal(0);
            });

            it("should handle non-numbers", function() {
                expect(utc.trimTiming("a")).to.equal(0);
            });

            it("should round to the nearest number", function() {
                expect(utc.trimTiming(0, 0)).to.equal(0);
                expect(utc.trimTiming(100, 0)).to.equal(100);
                expect(utc.trimTiming(100.5, 0)).to.equal(101);
                expect(utc.trimTiming(100.01, 0)).to.equal(100);
                expect(utc.trimTiming(100.99, 0)).to.equal(101);
            });

            it("should round when given a navtiming offset", function() {
                expect(utc.trimTiming(100)).to.equal(100);
                expect(utc.trimTiming(100, 1)).to.equal(99);
                expect(utc.trimTiming(100.12, 1.12)).to.equal(99);
                expect(utc.trimTiming(100, 100)).to.equal(0);
                expect(utc.trimTiming(100, 101)).to.equal(-1);
            });
        });

        //
        // .toBase36
        //
        describe(".toBase36()", function() {
            it("should return the base 36 equivalent of 100", function() {
                expect(utc.toBase36(100)).to.equal("2s");
            });

            it("should return an empty string if the input is not a number", function() {
                expect(utc.toBase36()).to.equal("");
                expect(utc.toBase36("")).to.equal("");
                expect(utc.toBase36("a")).to.equal("");
            });
        });

        //
        // .compressUserTiming
        //
        describe(".compressUserTiming()", function() {
            it("should do nothing with an empty list", function() {
                expect(utc.compressUserTiming([])).to.deep.equal([]);
            });

            it("should compress a single mark", function() {
                expect(utc.compressUserTiming([{
                    entryType: "mark",
                    name: "mark1",
                    startTime: 1
                }])).to.deep.equal({ "mark1": 1 });
            });

            it("should compress two marks of the same name", function() {
                expect(utc.compressUserTiming([{
                    entryType: "mark",
                    name: "mark1",
                    startTime: 1
                }, {
                    entryType: "mark",
                    name: "mark1",
                    startTime: 3
                }])).to.deep.equal({ "mark1": "1.2" });
            });

            it("should compress two marks with different names", function() {
                expect(utc.compressUserTiming([{
                    entryType: "mark",
                    name: "mark1",
                    startTime: 1
                }, {
                    entryType: "mark",
                    name: "mark2",
                    startTime: 3
                }])).to.deep.equal({ "mark1": 1, "mark2": 3 });
            });

            it("should compress a single measure", function() {
                expect(utc.compressUserTiming([{
                    entryType: "measure",
                    name: "measure1",
                    startTime: 1,
                    duration: 1
                }])).to.deep.equal({ "measure1": "1_1" });
            });

            it("should compress a single measure with a rounded duration", function() {
                expect(utc.compressUserTiming([{
                    entryType: "measure",
                    name: "measure1",
                    startTime: 1,
                    duration: 0.750
                }])).to.deep.equal({ "measure1": "1_1" });
            });

            it("should compress a single measure with a duration of 0", function() {
                expect(utc.compressUserTiming([{
                    entryType: "measure",
                    name: "measure1",
                    startTime: 1,
                    duration: 0
                }])).to.deep.equal({ "measure1": "1_" });
            });

            it("should compress two measures of the same name", function() {
                expect(utc.compressUserTiming([{
                    entryType: "measure",
                    name: "measure1",
                    startTime: 1,
                    duration: 1
                }, {
                    entryType: "measure",
                    name: "measure1",
                    startTime: 3,
                    duration: 5
                }])).to.deep.equal({ "measure1": "1_1.2_5" });
            });

            it("should compress two measures with different names", function() {
                expect(utc.compressUserTiming([{
                    entryType: "measure",
                    name: "measure1",
                    startTime: 1,
                    duration: 1
                }, {
                    entryType: "measure",
                    name: "measure2",
                    startTime: 3,
                    duration: 5
                }])).to.deep.equal({ "measure1": "1_1", "measure2": "3_5" });
            });

            it("should compress a mark and a measure", function() {
                expect(utc.compressUserTiming([{
                    entryType: "mark",
                    name: "mark1",
                    startTime: 1
                }, {
                    entryType: "measure",
                    name: "measure1",
                    startTime: 3,
                    duration: 5
                }])).to.deep.equal({ "mark1": 1, "measure1": "3_5" });
            });

            it("should compress mark and should have integer values", function() {
                expect(utc.compressUserTiming([{
                    entryType: "mark",
                    name: "abc",
                    startTime: 189
                }, {
                    entryType: "measure",
                    name: "abcd",
                    startTime: 1300
                }])).to.deep.equal({ "abc": 59, "abcd": 104 });
            });
        });

        //
        // .convertToTrie
        //
        describe(".convertToTrie()", function() {
            it("should convert a single node", function() {
                var data = { "abc": "abc" };
                var expected = {
                    "a": {
                        "b": {
                            "c": "abc"
                        }
                    }
                };
                expect(utc.convertToTrie(data)).to.eql(expected);
            });

            it("should convert a two-node tree whose nodes don't intersect", function() {
                var data = { "abc": "abc", "xyz": "xyz" };
                var expected = {
                    "a": {
                        "b": {
                            "c": "abc"
                        }
                    },
                    "x": {
                        "y": {
                            "z": "xyz"
                        }
                    }
                };
                expect(utc.convertToTrie(data)).to.eql(expected);
            });

            it("should convert a complex tree", function() {
                var data = { "abc": "abc", "abcd": "abcd", "ab": "ab" };
                var expected = {
                    "a": {
                        "b": {
                            "!": "ab",
                            "c": {
                                "!": "abc",
                                "d": "abcd"
                            }
                        }
                    }
                };
                expect(utc.convertToTrie(data)).to.eql(expected);
            });

            it("should be able to convert to a trie when value is an integer", function() {
                var data = { "abc": 59, "abcd": 104 };
                var expected = {
                    "a": {
                        "b": {
                            "c": {
                                "!": 59,
                                "d": 104
                            }
                        }
                    }
                };
                expect(utc.convertToTrie(data)).to.eql(expected);
            });
        });

        //
        // .optimizeTrie
        //
        describe(".optimizeTrie()", function() {
            it("should optimize a single-node tree", function() {
                var data = { "abc": "abc" };
                var expected = {
                    "abc": "abc"
                };

                var trie = utc.convertToTrie(data);

                expect(utc.optimizeTrie(trie, true)).to.eql(expected);
            });

            it("should optimize a simple tree", function() {
                var data = { "abc": "abc", "xyz": "xyz" };
                var expected = {
                    "abc": "abc",
                    "xyz": "xyz"
                };

                var trie = utc.convertToTrie(data);

                expect(utc.optimizeTrie(trie, true)).to.eql(expected);
            });

            it("should optimize a complex tree", function() {
                var data = { "abc": "abc", "abcd": "abcd", "ab": "ab" };
                var expected = {
                    "ab":
                    {
                        "!": "ab",
                        "c": {
                            "!": "abc",
                            "d": "abcd"
                        }
                    }
                };

                var trie = utc.convertToTrie(data);

                expect(utc.optimizeTrie(trie, true)).to.eql(expected);
            });

            it("should optimize a tree with integer values", function() {
                var trie = {
                    "a": {
                        "b": {
                            "c": {
                                "!": 59,
                                "d": 104
                            }
                        }
                    }
                };
                var expected = {
                    "abc":
                    {
                        "!": 59,
                        "d": 104
                    }
                };
                expect(utc.optimizeTrie(trie, true)).to.eql(expected);
            });
        });

        //
        // compressArray
        //
        describe(".compressArray()", function() {
            it("should return an empty string for non-arrays", function() {
                expect(utc.compressArray()).to.equal("");
                expect(utc.compressArray(1)).to.equal("");
                expect(utc.compressArray(false)).to.equal("");
                expect(utc.compressArray(true)).to.equal("");
                expect(utc.compressArray("")).to.equal("");
                expect(utc.compressArray("a")).to.equal("");
            });

            it("should return an single-value array", function() {
                expect(utc.compressArray([1])).to.equal(1);
            });

            it("should return an two-value array of the same value", function() {
                expect(utc.compressArray([1, 1])).to.equal("1*");
            });

            it("should return an three-value array of the same value", function() {
                expect(utc.compressArray([1, 1, 1])).to.equal("1*3");
            });

            it("should return an five-value array of the same value", function() {
                expect(utc.compressArray([1, 1, 1, 1, 1])).to.equal("1*5");
            });

            it("should return an two-value array of different values", function() {
                expect(utc.compressArray([1, 2])).to.equal("1.2");
            });

            it("should return an 10 value array", function() {
                expect(utc.compressArray([1, 1, 1, 2, 1, 1, 5, 4, 1, 1])).to.equal("1*3.2.1*.5.4.1*");
            });
        });

        //
        // compressForUri
        //
        describe(".compressForUri()", function() {
            it("should return an empty string for non-objects", function() {
                expect(utc.compressForUri()).to.equal("");
                expect(utc.compressForUri(null)).to.equal("");
                expect(utc.compressForUri(1)).to.equal("");
                expect(utc.compressForUri(0)).to.equal("");
                expect(utc.compressForUri("a")).to.equal("");
                expect(utc.compressForUri("")).to.equal("");
                expect(utc.compressForUri(undefined)).to.equal("");
                expect(utc.compressForUri(true)).to.equal("");
                expect(utc.compressForUri(false)).to.equal("");
            });

            it("should compress simple data to array form", function() {
                expect(utc.compressForUri({
                    "mark1": "2s",
                    "mark2": "5k",
                    "mark3": "8c"
                })).to.equal("0mark1~2s~mark2~5k~mark3~8c");
            });

            it("should compress other simple data to trie form", function() {
                expect(utc.compressForUri({
                    "measure1": "2s",
                    "measure2": "5k",
                    "measure3": "8c"
                })).to.equal("~(measure~(1~'2s~2~'5k~3~'8c))");
            });
        });

        //
        // flattenArray
        //
        describe(".flattenArray()", function() {
            it("should return an empty string for non-objects", function() {
                expect(utc.flattenArray()).to.equal("");
                expect(utc.flattenArray(null)).to.equal("");
                expect(utc.flattenArray(1)).to.equal("");
                expect(utc.flattenArray(0)).to.equal("");
                expect(utc.flattenArray("a")).to.equal("");
                expect(utc.flattenArray("")).to.equal("");
                expect(utc.flattenArray(undefined)).to.equal("");
                expect(utc.flattenArray(true)).to.equal("");
                expect(utc.flattenArray(false)).to.equal("");
            });

            it("should return an empty string for an empty object", function() {
                expect(utc.flattenArray({})).to.equal("");
            });

            it("should return a string for a single object", function() {
                expect(utc.flattenArray({ foo: "1" })).to.equal("foo~1");
            });

            it("should return a string for a single object with an integer value", function() {
                expect(utc.flattenArray({ foo: 1 })).to.equal("foo~1");
            });

            it("should return a string for a two objects", function() {
                expect(utc.flattenArray({ foo: "1", bar: "2" })).to.equal("foo~1~bar~2");
            });

            it("should work with a name with a value of ~", function() {
                expect(utc.flattenArray({ "~": "1" })).to.equal("%7E~1");
            });
        });
    });
}(typeof window !== "undefined" ? window : undefined));
