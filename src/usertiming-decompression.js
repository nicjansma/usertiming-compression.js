//
// usertiming-decompression.js
//
// Decompresses UserTiming data compressed via usertiming-compression.js.
//
// See http://nicj.net/compressing-usertiming/
//
// https://github.com/nicjansma/usertiming-compression.js
//
(function(window) {
    "use strict";

    // save old UserTimingDecompression object for noConflict()
    var root;
    var previousObj;
    if (typeof window !== "undefined") {
        root = window;
        previousObj = root.UserTimingDecompression;
    }

    // model
    var self, UserTimingDecompression = self = {};

    //
    // Functions
    //
    /**
     * Changes the value of UserTimingDecompression back to its original value, returning
     * a reference to the UserTimingDecompression object.
     *
     * @returns {object} Original UserTimingDecompression object
     */
    UserTimingDecompression.noConflict = function() {
        root.UserTimingDecompression = previousObj;
        return UserTimingDecompression;
    };

    /**
     * Decompresses a compressed UserTiming string in Trie (JSURL), Trie (JSON url-encoded),
     * Trie (JSON) or array (url-encoded) form.
     *
     * @param {string} data UserTiming data string
     * @param {object} options Options
     *
     * @returns {UserTiming[]} UserTiming array
     */
    UserTimingDecompression.decompressFromString = function(data, options) {
        var entries = [];

        options = options || {};

        if (typeof data !== "string") {
            return entries;
        }

        //
        // Start by determining it's compression type:
        // * if it starts with '~', it's in Trie (JSURL) form
        // * if it starts with '{', it's in Trie (JSON URL-encoded) form
        // * if it starts with '(', it's in Trie (JSON) form
        // * if it starts with '0', it's in array (URL-encoded) form
        // * if it starts with '1', it's in array (map) form
        //
        var compressionType = data[0];
        if (compressionType === "~" ||
            compressionType === "{" ||
            compressionType === "(") {
            entries = self.decompressUriTrie(data);
        } else if (compressionType === "0") {
            entries = self.decompressUriArray(data.substring(1));
        } else if (compressionType === "1") {
            entries = self.decompressUriMap(data.substring(1), options.map);
        }

        return entries;
    };

    /**
     * Decompresses a compressed UserTiming trie
     *
     * @param {object} data UserTiming trie
     * @param {string} prefix Name prefix for the current node
     *
     * @returns {UserTiming[]} UserTiming array
     */
    UserTimingDecompression.decompressUriTrie = function(data, prefix) {
        var resources = [];

        // convert from encoded-URI or JSURL form to an object
        if (typeof data === "string") {
            if (data[0] === "~") {
                //
                // JSURL
                //
                data = self.jsUrl(data);
            } else if (data[0] === "{" || data[0] === "(") {
                //
                // Regular Trie '{' or URL-friendly Trie '(' form
                //
                if (data[0] === "(") {
                    //
                    // compressed Trie URL form
                    //
                    data = data.replace(/\(/g, "{")
                        .replace(/\)/g, "}")
                        .replace(/~/g, ":")
                        .replace(/\-/g, ",")
                        .replace(/'/g, "\"");
                }

                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // exception, bail
                    return [];
                }
            } else {
                return [];
            }
        }

        prefix = prefix || "";

        for (var key in data) {
            // skip over inherited properties
            if (!data.hasOwnProperty(key)) {
                continue;
            }

            var node = data[key];
            var nodeKey = prefix + key;

            // strip trailing !, which is used to designate a node that is a prefix for
            // other nodes but has resTiming data
            if (nodeKey.indexOf("!", nodeKey.length - 1) !== -1) {
                nodeKey = nodeKey.substring(0, nodeKey.length - 1);
            }

            if (typeof node === "string") {
                // add all occurences
                var timings = node.split("|");

                // end-node
                for (var i = 0; i < timings.length; i++) {
                    resources = resources.concat(this.generateUserTimings(nodeKey, timings[i]));
                }
            } else if (typeof node === "number") {
                // single entry whose characters were all digits
                resources = resources.concat(this.generateUserTimings(nodeKey, "" + node));
            } else {
                // continue down
                var nodeResources = this.decompressUriTrie(node, nodeKey);

                resources = resources.concat(nodeResources);
            }
      }

      return resources;
    };

    /**
     * Decompresses a compressed UserTiming URI-compressed array
     *
     * @param {string} data UserTiming URI-array
     *
     * @returns {UserTiming[]} Array of user-timing names to values
     */
    UserTimingDecompression.decompressUriArray = function(data) {
        var entries = [];

        if (typeof data !== "string") {
            return entries;
        }

        var dataSplit = data.split("~");

        for (var i = 0; i < dataSplit.length; i += 2) {
            entries = entries.concat(self.generateUserTimings(dataSplit[i], dataSplit[i + 1]));
        }

        return entries;
    };

    /**
     * Decompresses a compressed UserTiming URI-compressed array of mapped indexes
     *
     * @param {string} data UserTiming URI-array
     * @param {object} map Map of UserTiming names to indexes
     *
     * @returns {UserTiming[]} Array of user-timing names to values
     */
    UserTimingDecompression.decompressUriMap = function(data, map) {
        var entries = [];

        if (typeof data !== "string") {
            return entries;
        }

        if (typeof map === "undefined") {
            // return un-mapped array
            return this.decompressUriArray(data);
        }

        var dataSplit = data.split("~");

        for (var i = 0; i < dataSplit.length; i++) {
            var line = dataSplit[i];
            var idx = 0;
            var value = "";

            // decompress the map index
            if (line[0] === "-") {
                // greater than 35 ("z")
                if (line[1] === "0") {
                    // between 36 ("00") and 71 ("0z")
                    idx = 36 + parseInt(line[2], 36);
                } else {
                    // between 72 ("10") and 1331 ("zz")
                    idx = 36 + parseInt(line.substr(1, 2), 36);
                }

                value = line.substr(3);
            } else {
                // between 0 ("0") and 35 ("z")
                idx = parseInt(line[0], 36);
                value = line.substr(1);
            }

            // see if this index has a matching name
            for (var name in map) {
                if (map.hasOwnProperty(name) && map[name] === idx) {
                    entries = entries.concat(self.generateUserTimings(name, value));
                    break;
                }
            }
        }

        return entries;
    };

    /**
     * Generates UserTimings from a name and string value
     *
     * @param {string} name UserTiming name
     * @param {string} valueString Value string
     *
     * @returns {UserTiming} UserTiming object
     */
    UserTimingDecompression.generateUserTimings = function(name, valueString) {
        var entries = [], latestTime = 0;

        // this value was cast as an integer to save space in JSURL form,
        // since all of its characters were digits
        if (typeof valueString === "number") {
            valueString = "" + valueString;
        }

        if (typeof name !== "string" ||
            typeof valueString !== "string") {
            return entries;
        }

        // replace previous escapements of ~
        name = name.replace("%7E", "~");

        var values = self.decompressArray(valueString);

        for (var i = 0; i < values.length; i++) {
            var val = values[i];

            latestTime += parseInt(val, 36);

            var entry = {
                name: name,
                startTime: latestTime
            };

            if (val.indexOf("_") !== -1) {
                entry.duration = parseInt(val.substring(val.indexOf("_") + 1), 36);
                entry.entryType = "measure";
            } else {
                entry.duration = 0;
                entry.entryType = "mark";
            }

            entries.push(entry);
        }

        return entries;
    };

    /**
     * Decompresses an array of multiple values (separated by ".")
     *
     * @param {string} data Value string
     *
     * @returns {number[]} List of values
     */
    UserTimingDecompression.decompressArray = function(data) {
        if (typeof data !== "string") {
            return [];
        }

        var entryValues = [];

        // the value entries are separated by periods (".")
        var valuesSplit = data.split(".");

        for (var i = 0; i < valuesSplit.length; i++) {
            var thisVal = valuesSplit[i];

            // see if there are any repeats (designated by "*")
            var thisValSplit = thisVal.split("*");

            if (thisValSplit.length === 1) {
                // single value
                entryValues.push(thisVal !== "" ? thisVal : "0");
            } else {
                thisVal = thisValSplit[0];

                var splitCount = thisValSplit[1];
                if (splitCount === "") {
                    // default to 2
                    splitCount = 2;
                }

                // repeated value
                for (var j = 0; j < splitCount; j++) {
                    entryValues.push(thisVal !== "" ? thisVal : "0");
                }
            }
        }

        return entryValues;
    };

    /**
     * Decompresses a compressed UserTiming string from URL-encoded form
     *
     * @param {string} data UserTiming data from a URL-encoded form
     * @param {object} options Options
     *
     * @returns {UserTiming[]} UserTiming array
     */
    UserTimingDecompression.decompressUserTiming = function(data, options) {
        if (typeof data !== "string") {
            return [];
        }

        var entries = self.decompressFromString(data, options);

        // sort by start time
        entries.sort(function(a, b) {
            if (a.startTime !== b.startTime) {
                return a.startTime - b.startTime;
            } else {
                return a.duration - b.duration;
            }
        });

        return entries;
    };

    /**
     * JSURL reserved value map
     */
    var JSURL_RESERVED = {
        true: true,
        false: false,
        null: null
    };

    /**
     * Converts from JSURL to JSON
     * Adapted from https://github.com/Sage/jsurl
     *
     * @param {string} s JSURL string
     *
     * @returns {object} Decompressed object
     */
    UserTimingDecompression.jsUrl = function(s) {
        if (typeof s !== "string") {
            return s;
        }

        var i = 0;
        var len = s.length;

        /**
         * Eats the specified character, and throws an exception if another character
         * was found
         *
         * @param {string} expected Expected string
         */
        function eat(expected) {
            if (s[i] !== expected) {
                throw new Error("bad JSURL syntax: expected " + expected + ", got " + (s && s[i]));
            }

            i++;
        }

        /**
         * Decodes the next value
         *
         * @returns {string} Next value
         */
        function decode() {
            var beg = i;
            var ch;
            var r = "";

            // iterate until we reach the end of the string or "~" or ")"
            while (i < len && (ch = s[i]) !== "~" && ch !== ")") {
                switch (ch) {
                    case "*":
                        if (beg < i) {
                            r += s.substring(beg, i);
                        }

                        if (s[i + 1] === "*") {
                            // Unicode characters > 0xff (255), which are encoded as "**[4-digit code]"
                            r += String.fromCharCode(parseInt(s.substring(i + 2, i + 6), 16));
                            beg = (i += 6);
                        } else {
                            // Unicode characters <= 0xff (255), which are encoded as "*[2-digit code]"
                            r += String.fromCharCode(parseInt(s.substring(i + 1, i + 3), 16));
                            beg = (i += 3);
                        }
                        break;

                    case "!":
                        if (beg < i) {
                            r += s.substring(beg, i);
                        }

                        r += "$";
                        beg = ++i;
                        break;

                    default:
                        i++;
                }
            }

            return r + s.substring(beg, i);
        }

        return (function parseOne() {
            var result, ch, beg;

            eat("~");

            switch (ch = s[i]) {
                case "(":
                    i++;
                    if (s[i] === "~") {
                        // this is an Array
                        result = [];

                        if (s[i + 1] === ")") {
                            i++;
                        } else {
                            do {
                                result.push(parseOne());
                            } while (s[i] === "~");
                        }
                    } else {
                        // this is an object
                        result = {};

                        if (s[i] !== ")") {
                            do {
                                var key = decode();
                                result[key] = parseOne();
                            } while (s[i] === "~" && ++i);
                        }
                    }
                    eat(")");
                    break;

                case "'":
                    i++;
                    result = decode();
                    break;

                default:
                    beg = i++;
                    while (i < len && /[^)~]/.test(s[i])) {
                        i++;
                    }

                    var sub = s.substring(beg, i);

                    if (/[\d\-]/.test(ch)) {
                        result = parseFloat(sub);
                    } else {
                        result = JSURL_RESERVED[sub];

                        if (typeof result === "undefined") {
                            throw new Error("bad value keyword: " + sub);
                        }
                    }
            }

            return result;
        }());
    };

    //
    // Export to the appropriate location
    //
    if (typeof define === "function" && define.amd) {
        //
        // AMD / RequireJS
        //
        define([], function() {
            return UserTimingDecompression;
        });
    } else if (typeof module !== "undefined" && module.exports) {
        //
        // Node.js
        //
        module.exports = UserTimingDecompression;
    } else if (typeof root !== "undefined") {
        //
        // Browser Global
        //
        root.UserTimingDecompression = UserTimingDecompression;
    }
}(typeof window !== "undefined" ? window : undefined));
