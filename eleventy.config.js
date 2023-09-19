"use strict";

const { EleventyRenderPlugin } = require("@11ty/eleventy");
const { lightFormat } = require("date-fns");
const sanitize = require("sanitize-html");

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
module.exports = function (eleventyConfig) {
    process.env.TZ = "Europe/Vienna"; // We work in vienna for API requests

    eleventyConfig.addPlugin(EleventyRenderPlugin);

    eleventyConfig.addGlobalData("retryConfig", {
        // Tuned for 10 tries in 10 min
        retries: 10,
        factor: 1.87005,
        randomize: true,
    });

    eleventyConfig.addFilter("money", function (value) {
        const currency = value?.currency ?? "EUR";
        const currencyStyle = Intl.NumberFormat("de-AT", { style: "currency", currency: currency });

        return currencyStyle.format(typeof value === "number" ? value : value?.amount)
    });

    eleventyConfig.addFilter("sanitize", function (value) {
        return sanitize(value);
    });

    eleventyConfig.addFilter("values", function(value) {
        return Object.values(value);
    })

    eleventyConfig.addFilter("flatten", function(value, depth){
        if (Array.isArray(value)) {
            return value.flat(depth);
        }

        return value;
    })

    eleventyConfig.addFilter("localdate", function(value, format){
        return lightFormat(value, format ?? "dd.MM.yyyy");
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