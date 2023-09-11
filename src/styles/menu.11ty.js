"use strict";

const path = require("path");
const CleanCSS = require("clean-css");
const options = {
    level: 2,
    returnPromise: true,
};
const css = new CleanCSS(options);

module.exports = class {

    async data(){
        return {
            permalink: "/assets/styles/menu.min.css",
            eleventyExcludeFromCollections: true,
            entryPoint: path.resolve(__dirname, "menu.css"),
        }
    }

    async render({entryPoint}) {
        const output = await css.minify([entryPoint]);

        return output.styles;
    }

};