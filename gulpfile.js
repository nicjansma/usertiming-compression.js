(function() {
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
    var Server = require("karma").Server;
    var path = require("path");
    var jsoncombine = require("gulp-jsoncombine");
    var bower = require("gulp-bower");
    var replace = require("gulp-replace");

    var sourceFiles = [
        "*.js",
        "src/**/*.js",
        "test/*.js",
        "cli/*.js"
    ];

    //
    // Task Definitions
    //
    gulp.task("lint", function() {
        gulp.src(sourceFiles)
            .pipe(eslint())
            .pipe(eslint.format());
    });

    gulp.task("lint:build", function() {
        return gulp.src(sourceFiles)
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.format("checkstyle", fs.createWriteStream("eslint.xml")));
    });

    gulp.task("compress", function() {
        gulp.src([
            "!dist/*.min.*",
            "dist/*.js"
        ])
            .pipe(rename({
                suffix: ".min"
            }))
            .pipe(uglify({ mangle: true }))
            .pipe(gulp.dest("dist"));
    });

    gulp.task("build", function() {
        [
            { "file": "usertiming-compression", "name": "UserTimingCompression" },
            { "file": "usertiming-decompression", "name": "UserTimingDecompression" }
        ].forEach(function(o) {
            var vanillaJs = fs.readFileSync("./src/shared/vanilla.js", "utf8").replace(/__name__/g, o.name);
            var detectJs = fs.readFileSync("./src/shared/detect.js", "utf8").replace(/__name__/g, o.name);

            gulp.src("./src/" + o.file + ".js")
                .pipe(replace(/[^\n]*__module__;.*/g, detectJs))
                .pipe(rename(o.file + ".js"))
                .pipe(gulp.dest("./dist"));

            gulp.src("./src/" + o.file + ".js")
                .pipe(replace(/[^\n]*__module__;.*/g, vanillaJs))
                .pipe(rename(o.file + ".vanilla.js"))
                .pipe(gulp.dest("./dist"));
        });
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

    gulp.task("bower", function() {
        return bower();
    });

    gulp.task("karma", ["bower", "build-test", "mocha", "mocha-tap"], function(done) {
        new Server({
            configFile: path.join(__dirname, "karma.config.js"),
            singleRun: true
        }, done).start();
    });

    gulp.task("all", ["default"]);
    gulp.task("test", ["mocha", "mocha-tap", "karma"]);
    gulp.task("default", ["bower", "lint", "lint:build", "compress", "test"]);
    gulp.task("travis", ["default"]);
}());
