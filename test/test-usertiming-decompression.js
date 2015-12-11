/* eslint-env node, mocha */
(function(root) {
    "use strict";

    //
    // Run in either Mocha, Karma or Browser environments
    //
    if (typeof root === "undefined") {
        root = {};
    }

    var utd = root.UserTimingDecompression ?
        root.UserTimingDecompression :
        require("../src/usertiming-decompression");

    var chai = root.chai ? root.chai : require("chai");
    var expect = chai.expect;

    //
    // UserTimingDecompression
    //
    describe("UserTimingDecompression", function() {
        //
        // decompressFromString
        //
        describe(".decompressFromString()", function() {
            it("should return an empty list for an empty string", function() {
                expect(utd.decompressFromString("")).to.deep.equal([]);
            });

            it("should return an empty list for non-objects/strings", function() {
                expect(utd.decompressFromString()).to.deep.equal([]);
                expect(utd.decompressFromString(null)).to.deep.equal([]);
                expect(utd.decompressFromString(1)).to.deep.equal([]);
                expect(utd.decompressFromString(0)).to.deep.equal([]);
                expect(utd.decompressFromString({})).to.deep.equal([]);
                expect(utd.decompressFromString(undefined)).to.deep.equal([]);
                expect(utd.decompressFromString(true)).to.deep.equal([]);
                expect(utd.decompressFromString(false)).to.deep.equal([]);
            });

            it("should return a single mark for an array-encoded URI", function() {
                expect(utd.decompressFromString("0mark1~1")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                }]);
            });

            it("should return a single mark for an trie-encoded URI", function() {
                expect(utd.decompressFromString("('mark1'~'1')")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                }]);
            });

            it("should return a single measure for an trie-encoded URI", function() {
                expect(utd.decompressFromString("('mark1'~'1_a')")).to.deep.equal([{
                    name: "mark1",
                    entryType: "measure",
                    startTime: 1,
                    duration: 10
                }]);
            });
        });

        //
        // decompressUriTrie
        //
        describe(".decompressUriTrie()", function() {
            it("should return an empty list for an empty object", function() {
                expect(utd.decompressUriTrie({})).to.deep.equal([]);
            });

            it("should return an empty list for non-objects/strings", function() {
                expect(utd.decompressUriTrie()).to.deep.equal([]);
                expect(utd.decompressUriTrie(null)).to.deep.equal([]);
                expect(utd.decompressUriTrie(1)).to.deep.equal([]);
                expect(utd.decompressUriTrie(0)).to.deep.equal([]);
                expect(utd.decompressUriTrie("")).to.deep.equal([]);
                expect(utd.decompressUriTrie(undefined)).to.deep.equal([]);
                expect(utd.decompressUriTrie(true)).to.deep.equal([]);
                expect(utd.decompressUriTrie(false)).to.deep.equal([]);
            });

            it("should return an empty object for strings that aren't valid uri-JSON", function() {
                expect(utd.decompressUriTrie("a")).to.deep.equal([]);
                expect(utd.decompressUriTrie("a:/")).to.deep.equal([]);
                expect(utd.decompressUriTrie("{a:~")).to.deep.equal([]);
                expect(utd.decompressUriTrie("b")).to.deep.equal([]);
            });

            it("should return UserTimings for a simple mark object-JSON", function() {
                expect(utd.decompressUriTrie({"a": "1"})).to.deep.equal([{
                    name: "a",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                }]);
            });

            it("should return UserTimings for a simple mark object-JSON URI-encoded", function() {
                expect(utd.decompressUriTrie("('a'~'1')")).to.deep.equal([{
                    name: "a",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                }]);
            });

            it("should return UserTimings for a simple mark JSURL encoded", function() {
                expect(utd.decompressUriTrie("~(a~'1)")).to.deep.equal([{
                    name: "a",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                }]);
            });

            it("should return UserTimings for a simple measure JSURL encoded", function() {
                expect(utd.decompressUriTrie("~(a~'1_a)")).to.deep.equal([{
                    name: "a",
                    entryType: "measure",
                    startTime: 1,
                    duration: 10
                }]);
            });
        });

        //
        // decompressUriArray
        //
        describe(".decompressUriArray()", function() {
            it("should return an empty array for non-strings", function() {
                expect(utd.decompressUriArray()).to.deep.equal([]);
                expect(utd.decompressUriArray(null)).to.deep.equal([]);
                expect(utd.decompressUriArray(1)).to.deep.equal([]);
                expect(utd.decompressUriArray(0)).to.deep.equal([]);
                expect(utd.decompressUriArray([])).to.deep.equal([]);
                expect(utd.decompressUriArray(undefined)).to.deep.equal([]);
                expect(utd.decompressUriArray(true)).to.deep.equal([]);
                expect(utd.decompressUriArray(false)).to.deep.equal([]);
                expect(utd.decompressUriArray([])).to.deep.equal([]);
            });

            it("should decompress a the value 'mark1~1'", function() {
                expect(utd.decompressUriArray("mark1~1")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                }]);
            });

            it("should decompress a the value 'mark1~10'", function() {
                expect(utd.decompressUriArray("mark1~10")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 36
                }]);
            });

            it("should decompress a the value 'mark1~a'", function() {
                expect(utd.decompressUriArray("mark1~a")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 10
                }]);
            });

            it("should decompress a the value 'measure~a_1'", function() {
                expect(utd.decompressUriArray("measure~a_1")).to.deep.equal([{
                    name: "measure",
                    entryType: "measure",
                    startTime: 10,
                    duration: 1
                }]);
            });

            it("should decompress a the value 'measure~1_a'", function() {
                expect(utd.decompressUriArray("measure~1_a")).to.deep.equal([{
                    name: "measure",
                    entryType: "measure",
                    startTime: 1,
                    duration: 10
                }]);
            });

            it("should decompress a the value 'mark1~1*'", function() {
                expect(utd.decompressUriArray("mark1~1*")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                },
                {
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 2
                }]);
            });

            it("should decompress a the value 'mark1~1*2'", function() {
                expect(utd.decompressUriArray("mark1~1*2")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                },
                {
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 2
                }]);
            });

            it("should decompress a the value 'mark1~1.2'", function() {
                expect(utd.decompressUriArray("mark1~1.2")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                },
                {
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 3
                }]);
            });

            it("should decompress the value 'mark1~1.2.'", function() {
                expect(utd.decompressUriArray("mark1~1.2.")).to.deep.equal([{
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                },
                {
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 3
                },
                {
                    name: "mark1",
                    entryType: "mark",
                    duration: 0,
                    startTime: 3
                }]);
            });

            it("should decompress a the value 'mark1~1.2*3.3*.", function() {
                expect(utd.decompressUriArray("mark1~1.2*3.3*.")).to.deep
                    .equal([{
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 1
                    },
                    {
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 3
                    },
                    {
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 5
                    },
                    {
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 7
                    },
                    {
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 10
                    },
                    {
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 13
                    },
                    {
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 13
                    }]);
            });

            it("should decompress a the value 'mark1~1~mark2~2", function() {
                expect(utd.decompressUriArray("mark1~1~mark2~2")).to.deep
                    .equal([{
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 1
                    },
                    {
                        name: "mark2",
                        entryType: "mark",
                        duration: 0,
                        startTime: 2
                    }]);
            });

            it("should decompress a the value 'mark1~1~mark2~2~mark3~3", function() {
                expect(utd.decompressUriArray("mark1~1~mark2~2~mark3~3")).to.deep
                    .equal([{
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 1
                    },
                    {
                        name: "mark2",
                        entryType: "mark",
                        duration: 0,
                        startTime: 2
                    },
                    {
                        name: "mark3",
                        entryType: "mark",
                        duration: 0,
                        startTime: 3
                    }]);
            });

            it("should decompress a the value 'mark1~1~measure2~2_a", function() {
                expect(utd.decompressUriArray("mark1~1~measure2~2_a")).to.deep
                    .equal([{
                        name: "mark1",
                        entryType: "mark",
                        duration: 0,
                        startTime: 1
                    },
                    {
                        name: "measure2",
                        entryType: "measure",
                        startTime: 2,
                        duration: 10
                    }]);
            });
        });

        //
        // generateUserTimings
        //
        describe(".generateUserTimings()", function() {
            it("should return an empty list when given non-string parameters", function() {
                expect(utd.generateUserTimings()).to.deep.equal([]);
                expect(utd.generateUserTimings(null)).to.deep.equal([]);
                expect(utd.generateUserTimings(0)).to.deep.equal([]);
                expect(utd.generateUserTimings(1)).to.deep.equal([]);
                expect(utd.generateUserTimings(false)).to.deep.equal([]);
                expect(utd.generateUserTimings(true)).to.deep.equal([]);
                expect(utd.generateUserTimings(undefined)).to.deep.equal([]);
                expect(utd.generateUserTimings({})).to.deep.equal([]);
                expect(utd.generateUserTimings([])).to.deep.equal([]);
                expect(utd.generateUserTimings("a", null)).to.deep.equal([]);
                expect(utd.generateUserTimings("a", false)).to.deep.equal([]);
                expect(utd.generateUserTimings("a", true)).to.deep.equal([]);
                expect(utd.generateUserTimings("a", undefined)).to.deep.equal([]);
                expect(utd.generateUserTimings("a", {})).to.deep.equal([]);
                expect(utd.generateUserTimings("a", [])).to.deep.equal([]);
            });

            it("should return an single mark when given an array with a single timing", function() {
                expect(utd.generateUserTimings("mark", "a")).to.deep.equal([{
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 10
                }]);
            });

            it("should return an single mark when given an array with a single timing that is numeric", function() {
                expect(utd.generateUserTimings("mark", 1)).to.deep.equal([{
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1
                }]);
            });

            it("should return an single mark when given an array with a large timing that is numeric", function() {
                expect(utd.generateUserTimings("mark", 123)).to.deep.equal([{
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 1371
                }]);
            });

            it("should return an single measure when given an array with a single timing", function() {
                expect(utd.generateUserTimings("measure", "a_a")).to.deep.equal([{
                    name: "measure",
                    entryType: "measure",
                    startTime: 10,
                    duration: 10
                }]);
            });

            it("should return two elements when given an array with a two timings", function() {
                expect(utd.generateUserTimings("mark", "a*")).to.deep.equal([
                {
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 10
                },
                {
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 20
                }]);
            });

            it("should return three elements when given an array with a three timings", function() {
                expect(utd.generateUserTimings("mark", "a*3")).to.deep.equal([
                {
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 10
                },
                {
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 20
                },
                {
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 30
                }]);
            });

            it("should return three elements when given an array with a three timings (non-repeating)", function() {
                expect(utd.generateUserTimings("mark", "a.b.c")).to.deep.equal([
                {
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 10
                },
                {
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 21
                },
                {
                    name: "mark",
                    entryType: "mark",
                    duration: 0,
                    startTime: 33
                }]);
            });

            it("should return three elements when given an array with a three timings (non-repeating)", function() {
                expect(utd.generateUserTimings("measure", "a_a.b_b.c_c")).to.deep.equal([
                {
                    name: "measure",
                    entryType: "measure",
                    startTime: 10,
                    duration: 10
                },
                {
                    name: "measure",
                    entryType: "measure",
                    startTime: 21,
                    duration: 11
                },
                {
                    name: "measure",
                    entryType: "measure",
                    startTime: 33,
                    duration: 12
                }]);
            });
        });

        //
        // decompressArray
        //
        describe(".decompressArray()", function() {
            it("should return an empty array for non-strings", function() {
                expect(utd.decompressArray()).to.deep.equal([]);
                expect(utd.decompressArray(null)).to.deep.equal([]);
                expect(utd.decompressArray(1)).to.deep.equal([]);
                expect(utd.decompressArray(0)).to.deep.equal([]);
                expect(utd.decompressArray({})).to.deep.equal([]);
                expect(utd.decompressArray(undefined)).to.deep.equal([]);
                expect(utd.decompressArray(true)).to.deep.equal([]);
                expect(utd.decompressArray(false)).to.deep.equal([]);
            });

            it("should decompress a the value '1'", function() {
                expect(utd.decompressArray("1")).to.deep.equal(["1"]);
            });

            it("should decompress a the value '10'", function() {
                expect(utd.decompressArray("10")).to.deep.equal(["10"]);
            });

            it("should decompress a the value 'a'", function() {
                expect(utd.decompressArray("a")).to.deep.equal(["a"]);
            });

            it("should decompress a the value '1*'", function() {
                expect(utd.decompressArray("1*")).to.deep.equal(["1", "1"]);
            });

            it("should decompress a the value '1*2'", function() {
                expect(utd.decompressArray("1*2")).to.deep.equal(["1", "1"]);
            });

            it("should decompress a the value '1.2'", function() {
                expect(utd.decompressArray("1.2")).to.deep.equal(["1", "2"]);
            });

            it("should decompress a the value '1.2.'", function() {
                expect(utd.decompressArray("1.2.")).to.deep.equal(["1", "2", "0"]);
            });

            it("should decompress a the value '1.2*3.3*.", function() {
                expect(utd.decompressArray("1.2*3.3*.")).to.deep.equal(["1", "2", "2", "2", "3", "3", "0"]);
            });

            it("should decompress a the value '1_a'", function() {
                expect(utd.decompressArray("1_a")).to.deep.equal(["1_a"]);
            });

            it("should decompress a the value '1_a*2'", function() {
                expect(utd.decompressArray("1_a*2")).to.deep.equal(["1_a", "1_a"]);
            });
        });

        //
        // decompressUserTiming
        //
        describe(".decompressUserTiming()", function() {
            it("should return an empty array for non-strings", function() {
                expect(utd.decompressUserTiming()).to.deep.equal([]);
                expect(utd.decompressUserTiming(null)).to.deep.equal([]);
                expect(utd.decompressUserTiming(1)).to.deep.equal([]);
                expect(utd.decompressUserTiming(0)).to.deep.equal([]);
                expect(utd.decompressUserTiming({})).to.deep.equal([]);
                expect(utd.decompressUserTiming(undefined)).to.deep.equal([]);
                expect(utd.decompressUserTiming(true)).to.deep.equal([]);
                expect(utd.decompressUserTiming(false)).to.deep.equal([]);
            });

            it("should return UserTimings marks for a simple object-JSON", function() {
                expect(utd.decompressUserTiming("{\"a\": \"1\"}")).to.deep.equal([{
                    name: "a",
                    startTime: 1,
                    duration: 0,
                    entryType: "mark"
                }]);
            });

            it("should return UserTimings marks for a simple object-JSON URI-encoded", function() {
                expect(utd.decompressUserTiming("('a'~'1')")).to.deep.equal([{
                    name: "a",
                    startTime: 1,
                    duration: 0,
                    entryType: "mark"
                }]);
            });

            it("should return UserTimings marks or a simple JSURL encoded", function() {
                expect(utd.decompressUserTiming("~(a~'1)")).to.deep.equal([{
                    name: "a",
                    startTime: 1,
                    duration: 0,
                    entryType: "mark"
                }]);
            });

            it("should return UserTimings measures for a simple object-JSON", function() {
                expect(utd.decompressUserTiming("{\"a\": \"1_2\"}")).to.deep.equal([{
                    name: "a",
                    startTime: 1,
                    entryType: "measure",
                    duration: 2
                }]);
            });

            it("should return UserTimings measures for a simple object-JSON URI-encoded", function() {
                expect(utd.decompressUserTiming("('a'~'1_2')")).to.deep.equal([{
                    name: "a",
                    startTime: 1,
                    entryType: "measure",
                    duration: 2
                }]);
            });

            it("should return UserTimings measures for a simple JSURL encoded", function() {
                expect(utd.decompressUserTiming("~(a~'1_2)")).to.deep.equal([{
                    name: "a",
                    startTime: 1,
                    entryType: "measure",
                    duration: 2
                }]);
            });

            it("should return UserTimings marks and measures for a simple object-JSON", function() {
                expect(utd.decompressUserTiming("{\"a\": \"1_2.1\"}")).to.deep.equal([
                {
                    name: "a",
                    startTime: 1,
                    entryType: "measure",
                    duration: 2
                },
                {
                    name: "a",
                    startTime: 2,
                    duration: 0,
                    entryType: "mark"
                }]);
            });

            it("should return UserTimings marks and measures for a simple object-JSON URI-encoded", function() {
                expect(utd.decompressUserTiming("('a'~'1_2.1')")).to.deep.equal([{
                    name: "a",
                    startTime: 1,
                    entryType: "measure",
                    duration: 2
                },
                {
                    name: "a",
                    startTime: 2,
                    duration: 0,
                    entryType: "mark"
                }]);
            });

            it("should return UserTimings marks and measures for a simple JSURL encoded", function() {
                expect(utd.decompressUserTiming("~(a~'1_2.1)")).to.deep.equal([{
                    name: "a",
                    startTime: 1,
                    entryType: "measure",
                    duration: 2
                },
                {
                    name: "a",
                    startTime: 2,
                    duration: 0,
                    entryType: "mark"
                }]);
            });
        });
    });
}(typeof window !== "undefined" ? window : undefined));
