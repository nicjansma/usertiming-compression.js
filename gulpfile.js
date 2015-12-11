(function(root) {
    "use strict";

    //
    // Imports
    //
    var fs = require("fs");
    var gulp = require("gulp");
    var eslint = require("gulp-eslint");
    var uglify = require("gulp-uglify");
    var mocha = require("gulp-spawn-mocha");
    var rename = require("gulp-rename");
    var karma = require("karma").server;
    var path = require("path");
    var jsoncombine = require("gulp-jsoncombine");

    //
    // Task Definitions
    //
    gulp.task("lint", function() {
        gulp.src(["*.js", "src/*.js", "test/*.js"])
            .pipe(eslint())
            .pipe(eslint.format());
    });

    gulp.task("compress", function() {
        gulp.src("src/*.js")
            .pipe(rename({
                suffix: ".min"
            }))
            .pipe(uglify({ mangle: true }))
            .pipe(gulp.dest("dist"));
    });

    gulp.task("build-test", function() {
        gulp.src("test/data/*.json")
            .pipe(jsoncombine("data.js", function(data) {
                var out = "window.TEST_DATA = ";

                out += JSON.stringify(data);

                out += ";";

                return new Buffer(out);
            }))
            .pipe(gulp.dest("./test/build"));
    });

    gulp.task("mocha", ["build-test"], function() {
        return gulp.src("test/test-*.js",
            {
                read: false
            })
            .pipe(mocha());
    });

    gulp.task("mocha-tap", ["mocha"], function() {
        return gulp.src("test/test-*.js",
            {
                read: false
            })
            .pipe(mocha({
                reporter: "tap",
                output: "./test/mocha.tap"
            }));
    });

    gulp.task("karma", ["build-test", "mocha", "mocha-tap"], function(done) {
        return karma.start({
            configFile: path.join(__dirname, "karma.config.js"),
            singleRun: true
        }, done);
    });

    gulp.task("all", ["default"]);
    gulp.task("test", ["mocha", "mocha-tap", "karma"]);
    gulp.task("default", ["lint", "compress", "test"]);
    gulp.task("travis", ["default"]);
}());
