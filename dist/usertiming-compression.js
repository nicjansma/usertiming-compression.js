// TODO:
// 1. Options to only filter for specific marks / measures
// 2. Change values that are only ints into ints, not strings

//
// usertiming-compression.js
//
// Compresses UserTiming data.
//
// See http://nicj.net/compressing-usertiming/
//
// https://github.com/nicjansma/usertiming-compression.js
//
(function(window) {
    "use strict";

    // save old UserTimingCompression object for noConflict()
    var root;
    var previousObj;
    if (typeof window !== "undefined") {
        root = window;
        previousObj = root.UserTimingCompression;
    } else {
        root = {};
    }

    // model
    var self, UserTimingCompression = self = {};

    //
    // Functions
    //
    /**
     * Changes the value of UserTimingCompression back to its original value, returning
     * a reference to the UserTimingCompression object.
     *
     * @returns {object} Original UserTimingCompression object
     */
    UserTimingCompression.noConflict = function() {
        root.UserTimingCompression = previousObj;
        return UserTimingCompression;
    };

    /**
     * Trims the timing, returning an offset from the startTime in ms
     *
     * @param {number} time Time
     * @param {number} startTime Start time
     *
     * @returns {number} Number of ms from start time
     */
    UserTimingCompression.trimTiming = function(time, startTime) {
        if (typeof time !== "number") {
            time = 0;
        }

        if (typeof startTime !== "number") {
            startTime = 0;
        }

        // strip from microseconds to milliseconds only
        var timeMs = Math.round(time),
            startTimeMs = Math.round(startTime);

        return timeMs === 0 ? 0 : (timeMs - startTimeMs);
    };

    /**
     * Converts a number to base-36
     *
     * @param {number} n Number
     * @returns {number|string} Base-36 number, or empty string if undefined.
     */
    UserTimingCompression.toBase36 = function(n) {
        return (typeof n === "number") ? n.toString(36) : "";
    };

    /**
     * Gets all of the UserTiming entries for a frame

     * @param {object} frame Window or frame DOM object
     *
     * @returns {PerformanceEntry[]} UserTiming entries
     */
    UserTimingCompression.findUserTimingForFrame = function(frame) {
        var entries;

        if (!frame) {
            return [];
        }

        try {
            // Try to access location.href first to trigger any Cross-Origin
            // warnings.  There's also a bug in Chrome ~48 that might cause
            // the browser to crash if accessing X-O frame.performance.
            // https://code.google.com/p/chromium/issues/detail?id=585871
            // This variable is not otherwise used.
            /* eslint-disable no-unused-vars */
            var frameLoc = frame.location && frame.location.href;
            /* eslint-enable no-unused-vars */

            if (!("performance" in frame) ||
                !frame.performance ||
                !frame.performance.getEntriesByType) {
                return entries;
            }

            // gather marks and measures for this frame
            // TODO do we need to offset startTime?
            entries = frame.performance.getEntriesByType("mark");
            entries = entries.concat(frame.performance.getEntriesByType("measure"));
        } catch (e) {
            return entries;
        }

        return entries;
    };

    /**
     * Compresses UserTiming entry values
     *
     * @param {PerformanceEntry[]} entries Marks and measures
     * @param {object} options Options
     *
     * @returns {object} Compressed UserTiming values
     */
    UserTimingCompression.compressUserTiming = function(entries, options) {
        var i, e, time, latestTime = 0, entryNames = {};

        options = options || {};

        if (!entries || !entries.length) {
            return [];
        }

        // Gather entries into a lookup based on the name
        for (i = 0; i < entries.length; i++) {
            e = entries[i];

            // add an entry in the lookup if it doesn't already exist
            if (typeof entryNames[e.name] === "undefined") {
                entryNames[e.name] = [];
            }

            // add the relevant values for each type
            if (e.entryType === "mark") {
                entryNames[e.name].push({
                    startTime: e.startTime
                });
            } else if (e.entryType === "measure") {
                entryNames[e.name].push({
                    startTime: e.startTime,
                    duration: e.duration
                });
            }
        }

        //
        // Now, look through each named entry, compressing it's values.  The values
        // are sequential, and each startTime is offset by the previous start time.
        //
        for (var name in entryNames) {
            if (entryNames.hasOwnProperty(name)) {

                // if we were given a map of names, and this name doesn't exist in
                // the map, don't process this entry
                if (options.map && typeof options.map[name] === "undefined") {
                    continue;
                }

                var nameValues = entryNames[name];

                // change to the index in the map
                if (options.map && typeof options.map[name] !== "undefined") {
                    delete entryNames[name];
                    name = options.map[name];
                }

                // keep track of the last timestamp
                latestTime = 0;

                // iterate over all of this name's times
                for (i = 0; i < nameValues.length; i++) {

                    // the value will contain a startTime, and optionally, a duration
                    var value = nameValues[i];

                    // convert to base36, offset by the previous timestamp
                    time = self.toBase36(
                        self.trimTiming(value.startTime, latestTime));

                    // we can change the value of 0 to an empty string to save a byte
                    if (time === "0") {
                        time = "";
                    }

                    var finalValue = time;

                    // if this is a measure (with a duration), tack on "_[duration]"
                    if (typeof value.duration === "number") {
                        // round duration to nearest ms
                        var duration = self.toBase36(Math.round(value.duration));

                        finalValue += "_";

                        // 0-value durations get left off
                        if (duration !== "0") {
                            finalValue += duration;
                        }
                    }

                    // keep track of the latest time for the next value
                    latestTime = value.startTime;

                    // store this value back in the array
                    nameValues[i] = finalValue;
                }

                // join
                entryNames[name] = self.compressArray(nameValues);
            }
        }

        return entryNames;
    };

    /**
     * Converts entries to a Trie:
     * http://en.wikipedia.org/wiki/Trie
     *
     * Assumptions:
     * 1) All entries have unique keys
     * 2) Keys cannot have "!" in their name.
     * 3) All key's values are strings
     *
     * Leaf nodes in the tree are the key's values.
     *
     * If key A is a prefix to key B, key A will be suffixed with "!"
     *
     * @param {object} entries Performance entries
     * @returns {object} A trie
     */
    UserTimingCompression.convertToTrie = function(entries) {
        var trie = {}, name, i, value, letters, letter, cur, node;

        if (!entries) {
            return {};
        }

        for (name in entries) {
            if (!entries.hasOwnProperty(name)) {
                continue;
            }

            value = entries[name];
            letters = name.split("");
            cur = trie;

            for (i = 0; i < letters.length; i++) {
                letter = letters[i];
                node = cur[letter];

                if (typeof node === "undefined") {
                    // nothing exists yet, create either a leaf if this is the end of the word,
                    // or a branch if there are letters to go
                    cur = cur[letter] = (i === (letters.length - 1) ? value : {});
                } else if (typeof node === "string") {
                    // this is a leaf, but we need to go further, so convert it into a branch
                    cur = cur[letter] = { "!": node };
                } else if (i === (letters.length - 1)) {
                    // this is the end of our key, and we've hit an existing node.  Add our timings.
                    cur[letter]["!"] = value;
                } else {
                    // continue onwards
                    cur = cur[letter];
                }
            }
        }

        return trie;
    };

    /**
     * Optimize the Trie by combining branches with no leaf
     *
     * @param {object} cur Current Trie branch
     * @param {boolean} top Whether or not this is the root node
     *
     * @returns {object} Optimized Trie
     */
    UserTimingCompression.optimizeTrie = function(cur, top) {
        var num = 0, node, ret, topNode;

        if (!cur) {
            return {};
        }

        for (node in cur) {
            if (typeof cur[node] === "object") {
                // optimize children
                ret = this.optimizeTrie(cur[node], false);
                if (ret) {
                    // swap the current leaf with compressed one
                    delete cur[node];
                    node = node + ret.name;
                    cur[node] = ret.value;
                }
            }
            num++;
        }

        if (num === 1) {
            // compress single leafs
            if (top) {
                // top node gets special treatment so we're not left with a {node:,value:} at top
                topNode = {};
                topNode[node] = cur[node];
                return topNode;
            } else {
                // other nodes we return name and value separately
                return { name: node, value: cur[node] };
            }
        } else if (top) {
            // top node with more than 1 child, return it as-is
            return cur;
        } else {
            // more than two nodes and not the top, we can't compress any more
            return false;
        }
    };

    /**
     * Compresses an Array of values
     *
     * @param {Array} entries Array of numbers
     *
     * @returns {string} Compressed array in string form
     */
    UserTimingCompression.compressArray = function(entries) {
        var dupeCount = 0, result = "";

        if (!entries || entries.length === 0 || entries.constructor !== Array) {
            return "";
        }

        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];

            if (i < entries.length - 1 && entry === entries[i + 1]) {
                dupeCount++;
            } else if (dupeCount > 0) {
                result += (result !== "" ? "." : "") + entry + "*";
                if (dupeCount >= 2) {
                    result += (dupeCount + 1);
                }

                dupeCount = 0;
            } else {
                result += (result !== "" ? "." : "") + entry;
            }
        }

        // if it's just numeric, leave as a number so JSURL compresses it better
        if (/^\d+$/.test(result)) {
            return parseInt(result, 10);
        }

        return result;
    };

    /**
     * Gathers UserTiming entries and compresses the result.
     *
     * @param {object} options Options
     *
     * @returns {object} Compressed UserTiming entries
     */
    UserTimingCompression.getCompressedUserTiming = function(options) {
        var frame, entries;

        options = options || {};
        frame = options.window || window;
        entries = this.findUserTimingForFrame(frame);

        // 'from' minimum time
        if (options.from) {
            entries = entries.filter(function(e) {
                return e.startTime + e.duration >= options.from;
            });
        }

        // 'to' maximum time
        if (options.to) {
            entries = entries.filter(function(e) {
                return e.startTime <= options.to;
            });
        }

        return self.compressUserTiming(entries, options);
    };

    /**
     * Optimizes compressed UserTiming data for URI transmission.
     *
     * @param {object} data data
     *
     * @returns {string} String suitable for encodeURIComponent()
     */
    UserTimingCompression.compressForUri = function(data) {
        if (typeof data !== "object") {
            return "";
        }

        //
        // Determine if the data is for a map, which is the most efficient
        // structure we can use.
        //
        var isMap = false;
        for (var name in data) {
            if (data.hasOwnProperty(name)) {
                if (isNaN(name)) {
                    isMap = false;
                    break;
                } else {
                    isMap = true;
                }
            }
        }

        // if we only had numbers in the map, we can flatten it more efficiently
        if (isMap) {
            return "1" + self.flattenMap(data);
        }

        //
        // We're going to convert the data to both a Trie (JSURL-encoded),
        // as well as an array of values flattened by ~, to see which one
        // is more efficient
        //

        //
        // Method #1: Trie
        //
        // convert to a Trie
        var unOptTrie = self.convertToTrie(data);

        // optimize the Trie
        var trie = self.optimizeTrie(unOptTrie, true);

        var trieJsURL = self.jsUrl(trie);

        //
        // Method #2: Flattened array
        //
        var ary = self.flattenArray(data);

        if (typeof ary !== "string" || ary.length === 0) {
            return "";
        }

        // encode the URI components to see which one is smaller
        var trieEnc = encodeURIComponent(trieJsURL);
        var aryEnc = encodeURIComponent(ary);

        // return the smaller one
        if (trieEnc.length < aryEnc.length) {
            return trieJsURL;
        } else {
            return "0" + ary;
        }
    };

    /**
     * Flattens an array from key:value pairs to a string separated by ~s
     *
     * Example: [name1]~[value1]~[name2]~[value2]
     *
     * @param {object} data Data in key;value form
     *
     * @returns {string} String representing the array
     */
    UserTimingCompression.flattenArray = function(data) {
        var ary = [];

        if (typeof data !== "object") {
            return "";
        }

        for (var name in data) {
            if (data.hasOwnProperty(name)) {
                var val = (data[name] + "").replace("~", "%7E");
                name = name.replace("~", "%7E");

                ary.push(name + "~" + val);
            }
        }

        ary = ary.join("~");

        return ary;
    };

    /**
     * Flattens an array from numeric key:value pairs to a string separated by ~s
     *
     * Example: [idx1][value1]~[idx2][value2]
     *
     * @param {object} data Data in key;value form
     *
     * @returns {string} String representing the array
     */
    UserTimingCompression.flattenMap = function(data) {
        var ary = [];

        if (typeof data !== "object") {
            return "";
        }

        for (var name in data) {
            if (data.hasOwnProperty(name)) {
                var nameInt = parseInt(name, 10);
                var nameBase36 = self.toBase36(nameInt);

                // maximum index of (1331 - 36).toString(36) = "-zz"
                if (nameInt > 1331) {
                    continue;
                }

                //
                // We'll try to fit the map index in a single (base 36) character.
                // If we can't, we'll use another character to denote (-), subtract
                // 36 from it, and append the new base36.
                //
                if (nameBase36.length > 1) {
                    // if the name is greater than 1 character, use expanded notation
                    nameBase36 = self.toBase36(nameInt - 36);

                    // ensure we fill 3 characters
                    nameBase36 = "-" + (nameBase36.length === 1 ? "0" : "") + nameBase36;
                }

                ary.push(nameBase36 + data[name]);
            }
        }

        // sort by map order
        ary.sort();

        // join into a string
        ary = ary.join("~");

        return ary;
    };

    /**
     * Converts the structure to URL-friendly JSON
     * Adapted from https://github.com/Sage/jsurl
     *
     * @param {object} v Object to convert
     *
     * @returns {string} URL-friendly JSON
     */
    UserTimingCompression.jsUrl = function(v) {
        /**
         * Encodes the specified string
         *
         * @param {string} s String
         *
         * @returns {string} Encoded string
         */
        function encode(s) {
            if (!/[^\w-.]/.test(s)) {
                // if the string is only made up of alpha-numeric, underscore,
                // dash or period, we can use it directly.
                return s;
            }

            // we need to escape other characters
            s = s.replace(/[^\w-.]/g, function(ch) {
                if (ch === "$") {
                    return "!";
                }

                // use the character code for this one
                ch = ch.charCodeAt(0);

                if (ch < 0x100) {
                    // if less than 256, use "*[2-char code]"
                    return "*" + ("00" + ch.toString(16)).slice(-2);
                } else {
                    // use "**[4-char code]"
                    return "**" + ("0000" + ch.toString(16)).slice(-4);
                }
            });

            return s;
        }

        switch (typeof v) {
            case "number":
                // for finite numbers, return "~[number]"
                return isFinite(v) ? "~" + v : "~null";

            case "string":
                // "~'[encoded string]"
                return "~'" + encode(v);

            case "boolean":
                // "~true" or "~false"
                return "~" + v;

            case "object":
                if (!v) {
                    return "~null";
                }

                if (Array.isArray(v)) {
                    // an array "~([array])"
                    return "~(" + (v.map(function(elt) {
                        return self.jsUrl(elt) || "~null";
                    }).join("") || "~") + ")";
                } else {
                    return "~(" + Object.keys(v).map(function(key) {
                        var val = self.jsUrl(v[key]);
                        // skip undefined and functions
                        return val && (encode(key) + val);
                    }).filter(function(str) {
                        return str;
                    }).sort().join("~") + ")";
                }

            default:
                // function, undefined
                return undefined;
        }
    };

    //
    // Export to the appropriate location
    //
    if (typeof define === "function" && define.amd) {
        //
        // AMD / RequireJS
        //
        define([], function() { // eslint-disable-line strict
            return UserTimingCompression; // eslint-disable-line no-undef
        });
    } else if (typeof module !== "undefined" && module.exports) {
        //
        // Node.js
        //
        module.exports = UserTimingCompression; // eslint-disable-line no-undef
    } else if (typeof root !== "undefined") {
        //
        // Browser Global
        //
        root.UserTimingCompression = UserTimingCompression; // eslint-disable-line no-undef, no-underscore-dangle
    }

}(typeof window !== "undefined" ? window : undefined));
