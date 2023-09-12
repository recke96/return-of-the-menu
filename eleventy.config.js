"use strict";

const { EleventyRenderPlugin } = require("@11ty/eleventy");
const sanitize = require("sanitize-html");

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
module.exports = function (eleventyConfig) {

    eleventyConfig.addPlugin(EleventyRenderPlugin);

    eleventyConfig.addFilter("money", function (value) {
        const currency = value?.currency ?? "EUR";
        const currencyStyle = Intl.NumberFormat("de-AT", { style: "currency", currency: currency });

        return currencyStyle.format(typeof value === "number" ? value : value?.amount)
    });

    eleventyConfig.addFilter("sanitize", function (value) {
        return sanitize(value);
    });

    return {
        dir: {
            input: "src",
            output: "dist",
            layouts: "_layouts",
        },
        templateFormats: ['njk', 'md', '11ty.js'],
    };
};