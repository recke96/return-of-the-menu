"use strict";

const fetch = require("@11ty/eleventy-fetch");
const retry = require("async-retry");
const { differenceInSeconds, endOfDay } = require("date-fns");
const url = "https://api.sai-cookart.at/foods?active=true";

module.exports = async function ({ retryConfig }) {
  try {
    const secondsToEnd = differenceInSeconds(endOfDay(new Date()), new Date());
    const data = await retry(
      () =>
        fetch(url, {
          duration: `${secondsToEnd}s`,
          type: "json",
        }),
      {
        ...retryConfig,
        onRetry: (e, attempt) =>
          console.error("[Sai CookArt] Attempt %d failed: %o", attempt, e),
      }
    );

    const menu = data
      .filter((food) => food.category.id === 2 /* Lunchmenu */)
      .map((food) => ({
        name: food.name.trim(),
        description: food.description,
        price: food.options?.length
          ? null
          : {
              amount: Number.parseFloat(food.price),
              currency: "EUR",
            },
        options:
          food.options?.map((opt) => ({
            name: opt.name,
            description: opt.description,
            price: {
              amount: Number.parseFloat(opt.pricePickup),
              currency: "EUR",
            },
          })) ?? [],
      }));

    return [
      {
        name: "Sai CookArt",
        slug: "sai-cookart",
        address: {
          street: "Wienerbergstraße 26",
          city: "1120 Wien",
        },
        homepage: "https://sai-cookart.at",
        latLng: [48.171837, 16.33204],
        menu: menu,
      },
    ];
  } catch (e) {
    console.error("Failed to fetch sai cookart menu: %o", e);
    return []; // Don't fail the whole build
  }
};
