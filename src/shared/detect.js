    //
    // Export to the appropriate location
    //
    if (typeof define === "function" && define.amd) {
        //
        // AMD / RequireJS
        //
        define([], function() { // eslint-disable-line strict
            return __name__; // eslint-disable-line no-undef
        });
    } else if (typeof module !== "undefined" && module.exports) {
        //
        // Node.js
        //
        module.exports = __name__; // eslint-disable-line no-undef
    } else if (typeof root !== "undefined") {
        //
        // Browser Global
        //
        root.__name__ = __name__; // eslint-disable-line no-undef, no-underscore-dangle
    }
