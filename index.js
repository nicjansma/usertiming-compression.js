//
// For the NodeJS module, export a top-level object with both
// UserTimingCompression and UserTimingDecompression objects
//
var exports = {
    UserTimingCompression: require("./dist/usertiming-compression"),
    UserTimingDecompression: require("./dist/usertiming-decompression")
};

module.exports = exports;
