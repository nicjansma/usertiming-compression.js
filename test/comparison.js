/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions, no-console */
(function() {
    "use strict";

    //
    // Imports
    //
    var fs = require("fs");
    var path = require("path");
    var msgpack = require("msgpack5")();
    var pako = require("pako");
    var UserTimingCompression = require(path.join(__dirname, "..", "src", "usertiming-compression"));
    var Table = require("cli-table2");
    var colors = require("colors/safe");

    // instantiate
    var table = new Table({
        head: ["Test", "JSON", "UTC", "UTC %", "JSON.gz", "JSON.gz %", "JSON.pack",
            "JSON.pack %", "TS.gz", "TS.gz %", "TS.pack", "TS.pack %"]
    });

    var files = fs.readdirSync(path.join(__dirname, "data"));

    var totalJson = 0;
    var totalJsonGz = 0;
    var totalJsonPack = 0;
    var totalUtc = 0;
    var totalUtcGz = 0;
    var totalUtcPack = 0;

    for (var i = 0; i < files.length; i++) {
        var data = JSON.parse(fs.readFileSync(path.join(__dirname, "data", files[i]), "utf8"));

        var entries = data.entries;
        var json = JSON.stringify(entries);
        var jsonLength = json.length;
        totalJson += jsonLength;

        var jsonGz = pako.deflate(json).length;
        var jsonGzPct = Math.round(jsonGz / jsonLength * 100) + "%";
        totalJsonGz += jsonGz;

        var jsonPack = msgpack.encode(entries).toString().length;
        var jsonPackPct = Math.round(jsonPack / jsonLength * 100) + "%";
        totalJsonPack += jsonPack;

        var options = {};
        if (data.map) {
            options.map = data.map;
        }

        // UserTimingCompression
        var compressed = UserTimingCompression.compressUserTiming(entries, options);

        var compressedForUri = UserTimingCompression.compressForUri(compressed);
        var utc = encodeURIComponent(compressedForUri).length;
        var utcPct = Math.round(utc / jsonLength * 100) + "%";

        totalUtc += utc;

        // Gzip
        var utcGz = pako.deflate(JSON.stringify(compressed)).length;
        var utcGzPct = Math.round(utcGz / utc * 100) + "%";
        totalUtcGz += utcGz;

        if (utcGz < utc) {
            utcGzPct = colors.red(utcGzPct);
        }

        // MessagePack
        var utcPack = msgpack.encode(compressed).toString().length;
        var utcPackPct = Math.round(utcPack / utc * 100) + "%";
        totalUtcPack += utcPack;

        if (utcPack < utc) {
            utcPackPct = colors.red(utcPackPct);
        }

        table.push([files[i], jsonLength, utc, utcPct, jsonGz, jsonGzPct,
            jsonPack, jsonPackPct, utcGz, utcGzPct, utcPack, utcPackPct]);
    }

    var totalUtcPct = Math.round(totalUtc / totalJson * 100) + "%";
    var totalJsonGzPct = Math.round(totalJsonGz / totalJson * 100) + "%";
    var totalJsonPackPct = Math.round(totalJsonPack / totalJson * 100) + "%";
    var totalUtcGzPct = Math.round(totalUtcGz / totalUtc * 100) + "%";
    var totalUtcPackPct = Math.round(totalUtcPack / totalUtc * 100) + "%";

    table.push(["Total", totalJson, totalUtc, totalUtcPct, totalJsonGz, totalJsonGzPct,
        totalJsonPack, totalJsonPackPct, totalUtcGz, totalUtcGzPct, totalUtcPack, totalUtcPackPct]);

    console.log(table.toString());
}(typeof window !== "undefined" ? window : undefined));
