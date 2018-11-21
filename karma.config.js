module.exports = function(config) {
    "use strict";

    config.set({
        basePath: "./",

        port: 4000,
        runnerPort: 4001,
        logLevel: config.LOG_INFO,

        colors: true,
        autoWatch: false,

        frameworks: ["mocha", "chai"],
        reporters: ["progress", "coverage", "tap"],
        browsers: ["PhantomJS"],

        files: [
            "dist/usertiming-compression.js",
            "dist/usertiming-decompression.js",
            "test/lib/*.js",
            "test/vendor/pako/dist/pako_deflate.js",
            "test/build/*.js",
            "test/test-*.js"
        ],

        coverageReporter: {
            type: "html",
            dir: "test/coverage/"
        },

        tapReporter: {
            outputFile: "test/karma.tap"
        }
    });
};
