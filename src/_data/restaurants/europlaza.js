"use strict";

require("dotenv").config();
const fetch = require("@11ty/eleventy-fetch");

module.exports = async function () {
    const token = await fetchAccessToken();
    const data = await fetchRestaurantData(token);


    return data;
}



const url = {
    api: "https://europlaza.pockethouse.io/api/graphql",
    token: "https://europlaza.pockethouse.io/oauth/token?grant_type=client_credentials&scope=read&redirect_uri=https://app.pockethouse.at&response-type=token",
};

async function fetchAccessToken() {
    const username = process.env.EUROPLAZA_USER;
    const password = process.env.EUROPLAZA_PASSWORD;

    if (!username || !password) {
        throw Error("Define environment variables 'EUROPLAZA_USER' and 'EUROPLAZA_PASSWORD'");
    }

    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const credentials = await fetch(url.token, {
        duration: "30m",
        type: "json",
        removeUrlQueryParams: true,
        fetchOptions: {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${auth}`,
            },
            body: "grant_type=client_credentials",
        },
    });

    return credentials.access_token;
}

async function fetchRestaurantData(accessToken) {
    const query = `
    query ($limit: Int!, $offset: Int!, $from: String!, $to: String!) {
        restaurants: getAllRestaurants(limit: $limit, offset: $offset) {
            id
            name
            weekdayMenus(startDate: $from, endDate: $to) {
                id
                date
                menuItems {
                    id
                    title
                    content
                    price
                    currency
                }
            }
        }
    }`;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 0);

    const reqBody = {
        query: query,
        variables: {
            limit: 50,
            offset: 0,
            from: start,
            to: end,
        },
    };

    const { data } = await fetch(url.api, {
        duration: "1d",
        type: "json",
        fetchOptions: {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(reqBody),
        },
    });

    return data.restaurants.map((restaurant) => ({
        name: restaurant.name,
        address: null,
        homepage: null,
        latLng: null,
        menu: restaurant.weekdayMenus
            .flatMap(dayMenu => dayMenu.menuItems)
            .map((item) => ({
                name: item.title.trim(),
                description: item.content.trim(),
                price: {
                    amount: item.price / 100,
                    currency: item.currency,
                },
                options: []
            })),
    }));
}