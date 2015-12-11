(function() {
    "use strict";

    //
    // Imports
    //
    var UserTimingCompression = require("../src/usertiming-compression");
    var fs = require("fs");

    //
    // Action
    //
    module.exports = function(inputFile, options) {
        var entries = JSON.parse(fs.readFileSync(inputFile));
        var compressed = UserTimingCompression.compressUserTiming(entries, options);
        var compressedForUri = UserTimingCompression.compressForUri(compressed);

        var space;
        var outputFile;

        if (options && options.parent) {
            if (options.parent.pretty) {
                space = 2;
            }
            if (options.parent.output) {
                outputFile = options.parent.output;
            }
        }

        if (outputFile) {
            fs.writeFileSync(outputFile, compressedForUri);
        } else {
            console.log(compressedForUri);
        }
    };
}());
