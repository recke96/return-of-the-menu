"use strict";

const {promises: {readFile}} = require("fs");
const chota = require.resolve("chota");

module.exports = class {

    async data(){
        return {
            permalink: "/assets/styles/chota.min.css",
            eleventyExcludeFromCollections: true,
        }
    }

    async render() {
        return await readFile(chota);
    }

};