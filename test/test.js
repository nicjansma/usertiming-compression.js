/* eslint-disable no-console */
var utc = require("../dist/usertiming-compression");
var fs = require("fs");
var path = require("path");

var testFiles = fs.readdirSync(path.join(__dirname, "data"));

for (var i = 0; i < testFiles.length; i++) {
    var file = testFiles[i];
    var data = require(path.join(__dirname, "data", file));

    console.log("****** " + file + " ******");
    console.log(data.entries);

    var comp = utc.compressUserTiming(data.entries);
    var out = {
        compressed: comp,
        uri: encodeURIComponent(utc.compressForURI(comp))
    };

    if (out.uri.marks === "") {
        delete out.compressed.marks;
        delete out.uri.marks;
    }

    if (out.uri.measures === "") {
        delete out.compressed.measures;
        delete out.uri.measures;
    }

    console.log(JSON.stringify(out));
}
