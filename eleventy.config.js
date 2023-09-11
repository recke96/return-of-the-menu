"use strict";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
module.exports = function (eleventyConfig) {

    return {
        dir: {
            input: "src",
            output: "dist"
        }
    };
};