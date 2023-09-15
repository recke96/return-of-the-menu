"use strict";

const fetch = require("@11ty/eleventy-fetch");
const url = "https://api.sai-cookart.at/foods?active=true";

module.exports = async function () {

    const data = await fetch(url, {
        duration: "1d",
        type: "json",
    });

    const menu = data
        .filter((food) => food.category.id === 2 /* Lunchmenu */)
        .map((food) => ({
            name: food.name.trim(),
            description: food.description,
            price: food.options?.length ? null : {
                amount: Number.parseFloat(food.price),
                currency: "EUR",
            },
            options: food.options?.map((opt) => ({
                name: opt.name,
                description: opt.description,
                price: {
                    amount: Number.parseFloat(opt.pricePickup),
                    currency: "EUR",
                }
            })) ?? [],
        }));

    return [{
        name: "Sai CookArt",
        address: {
            street: "Wienerbergstraße 26",
            city: "1120 Wien",
        },
        homepage: "https://sai-cookart.at",
        latLng: [48.171837, 16.33204],
        menu: menu
    }];
}