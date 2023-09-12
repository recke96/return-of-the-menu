"use strict";

const CleanCSS = require("clean-css");
const options = {
    level: 2,
    returnPromise: true,
};
const css = new CleanCSS(options);

const chota = require.resolve("chota");
const menu = require.resolve("./menu.css");

module.exports = class {

    async data() {
        return {
            permalink: "/assets/bundle.min.css",
            eleventyExcludeFromCollections: true,
            stylesheets: [chota, menu],
        }
    }

    async render({ stylesheets }) {
        const output = await css.minify(stylesheets);

        return output.styles;
    }
};