(function() {
    "use strict";

    //
    // Imports
    //
    var UserTimingDecompression = require("../src/usertiming-decompression");
    var fs = require("fs");

    //
    // Action
    //
    module.exports = function(inputFile, options) {
        var data = fs.readFileSync(inputFile, "utf-8");
        var decompressed = UserTimingDecompression.decompressUserTiming(data, options);

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

        var outputJSON = JSON.stringify(decompressed, null, space);

        if (outputFile) {
            fs.writeFileSync(outputFile, outputJSON);
        } else {
            console.log(outputJSON);
        }
    };
}());
