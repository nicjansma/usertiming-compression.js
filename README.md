# usertiming-compression.js

v0.1.3

[http://nicj.net](http://nicj.net)

Licensed under the MIT license

## Introduction

`usertiming-compression.js` compresses data from [UserTiming](http://www.w3.org/TR/user-timing/).  A
companion script, `usertiming-decompression.js`, converts the compressed data back to the original form.

[UserTiming](http://www.w3.org/TR/user-timing/) is a [modern browser](http://caniuse.com/#feat=user-timing) performance API that gives developers the ability the mark important events (timestamps) and measure durations (timestamp deltas) in their web apps.  The [PerformanceTimeline](http://www.w3.org/TR/performance-timeline/) has several methods such as
`performance.getEntriesByType('mark')` or `performance.getEntriesByType('measure')` that return each mark or measure's `startTime` (timestamp) and `duration` (for measures).

`usertiming-compression.js` applies several data-compression techniques to reduce the size of your serialized
UserTiming data to 10-15% of it's original size in many cases.  See
[this blog post](http://nicj.net/compressing-usertiming/) for a description of these techniques.

`usertiming-decompression.js` is a companion script that will take the compressed UserTiming data and
build it back to its original UserTiming form (eg. `performance.getEntriesByType('mark')`) for analysis.

## Download

Releases are available for download from [GitHub](https://github.com/nicjansma/usertiming-compression.js).

### Web - Compression

__Development:__ [usertiming-compression.js](https://github.com/nicjansma/usertiming-compression.js/raw/master/src/usertiming-compression.js) - 19kb

__Production:__ [usertiming-compression.min.js](https://github.com/nicjansma/usertiming-compression.js/raw/master/dist/usertiming-compression.min.js) - 3.9kb minified, 1.6kb gzipped

### Web - Decompression

__Development:__ [usertiming-decompression.js](https://github.com/nicjansma/usertiming-compression.js/raw/master/src/usertiming-decompression.js) - 15.9kb

__Production:__ [usertiming-decompression.min.js](https://github.com/nicjansma/usertiming-compression.js/raw/master/dist/usertiming-decompression.min.js) - 3.7kb minified, 1.5kb gzipped

### NPM

usertiming-compression.js is also available as the [npm usertiming-compression module](https://npmjs.org/package/usertiming-compression). You can install
using  Node Package Manager (npm):

    npm install usertiming-compression

### Bower

usertiming-compression.js is also available via [bower](http://bower.io/). You can install using:

    bower install usertiming-compression

## Usage

Please see the [W3C UserTiming API Reference](http://www.w3.org/TR/user-timing/) for details on how to use the
UserTiming API.

### usertiming-compression.js

To include usertiming-compression.js, include it via a script tag:

```html
<script type="text/javascript" src="usertiming-compression.min.js"></script>
```

Once included in the page, a top-level `UserTimingCompression` object is available on `window`.  If AMD or CommonJS environments are detected, it will expose itself via those methods.

From the NPM module:

```js
var UserTimingCompression = require("usertiming-compression").UserTimingCompression;
```

To get a map of compressed UserTiming names to values, you can call:

```js
var utMap = UserTimingCompression.getCompressedUserTiming(options);
// {
//     "mark1": "2s",
//     "mark2": "5k",
//     "mark3": "8c"
// }
```

If you have a [map](http://nicj.net/compressing-usertiming/) of mark / measure names you want to use, pass them in as `options.map`:

```js
var utMap = UserTimingCompression.getCompressedUserTiming({
    map: {
        "mark1": 0,
        "mark2": 1,
        "mark3": 2
    }
});
// {
//     "0": "2s",
//     "1": "5k",
//     "2": "8c"
// }
```

If you want to further compress this list for a format suitable for URL transmission (e.g. on a query string), you can use `compressForUri()`:

```js
var utData = UserTimingCompression.compressForUri(utMap);
// ~(m~(ark~(1~'2s~2~'5k~3~'8c)))
```

### API

#### `UserTimingCompression.getCompressedUserTiming(options)`

Gathers all UserTiming marks and measures from the root HTML page and all accessible IFRAMEs.

**Arguments**:
* `options` (optional)
* `options.map`: A map of names to indexes to use for compression.
* `options.from`: The minimum `startTime`
* `options.to`: The maximum `startTime`
* `options.window`: window object that will be queried for UserTiming data

**Returns**: A map of names to compressed values.

```js
{
    "mark1": "2s",
    "mark2": "5k",
    "mark3": "8c"
}
```

#### `UserTimingCompression.compressForUri(map)`

Takes the output of `getCompressedUserTiming()` and converts it into a string suitable for URI encoding.

**Arguments**:
* `map` A map of names to string values

**Returns**: A map of names to compressed values.

```
"~(m~(ark~(1~'2s~2~'5k~3~'8c)))"
```

**Note**: The first character of the string denotes what type of [compression](http://nicj.net/compressing-usertiming/) is used:

1. `~` is optimized Trie (JSURL) compression
2. `0` is a tilde array
3. `1` is a mapped array

### usertiming-decompression.js

To include usertiming-decompression.js, include it via a script tag:

```html
<script type="text/javascript" src="usertiming-decompression.min.js"></script>
```

Once included in the page, a top-level `UserTimingDecompression` object is available on `window`.  If AMD or CommonJS environments are detected, it will expose itself via those methods.

From the NPM module:

```js
var UserTimingDecompression = require("usertiming-compression").UserTimingDecompression;
```

To decompress your resources, you can call:

```js
var original = UserTimingDecompression.decompressUserTiming(utData);
```

### API

#### `UserTimingDecompression.decompressUserTiming(data)`

Decompresses data from a URI-encoded form.

**Arguments**:
* `data` Data compressed via `compressForUri()`

**Returns**: The original UserTiming data

```js
[
    {"duration":0,"entryType":"mark","name":"mark1","startTime":100},
    {"duration":0,"entryType":"mark","name":"mark1","startTime":150},
    {"duration":0,"entryType":"mark","name":"mark1","startTime":500}
]
```

## Tests

Tests are provided in the ``test/`` directory, and can be run via ``mocha``:

    mocha test/*

Or via ``gulp``:

    gulp test

## Version History

* v0.1.0 - 2015-12-10: Initial version
* v0.1.1 - 2016-04-04: `getCompressedUserTiming()` gathers Measures that end after the specified `from`
* v0.1.2 - 2016-04-04: Protect against X-O frame access that crashes some browsers
* v0.1.3 - 2016-07-25: `getCompressedUserTiming()` accepts an alternate window param passed into options

## Thanks

Parts of [JSURL](https://github.com/Sage/jsurl) were incorporated into this library.  This project builds upon the work of [ResourceTiming Compression](https://github.com/nicjansma/resourcetiming-compression.js), with guidance from [Philip Tellis](http://bluesmoon.info/) and others at [SOASTA](http://www.soasta.com).
