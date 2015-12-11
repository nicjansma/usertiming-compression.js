//
// For the NodeJS module, export a top-level object with both
// UserTimingCompression and UserTimingDecompression objects
//
var exports = {
    UserTimingCompression: require("./src/usertiming-compression"),
    UserTimingDecompression: require("./src/usertiming-decompression")
};

module.exports = exports;
