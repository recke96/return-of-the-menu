"use strict";

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
}
`;

const url = {
    api: "https://europlaza.pockethouse.io/api/graphql",
    token: "https://europlaza.pockethouse.io/oauth/token?grant_type=client_credentials&scope=read&redirect_uri=https://app.pockethouse.at&response-type=token",
};

require("dotenv").config();
const fetch = require("@11ty/eleventy-fetch");

module.exports = async function () {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date();
    end.setUTCHours(23, 59, 59, 0);

    const token = await fetchAccessToken();
    
    const reqBody = {
        query: query,
        variables: {
            limit: 50,
            offset: 0,
            from: start.toString(),
            to: end.toISOString(),
        },
    };
    console.log(reqBody);

    const data = await fetch(url.api, {
        duration: "1d",
        type: "json",
        fetchOptions: {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(reqBody),
        },
    });

    return [];
}

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