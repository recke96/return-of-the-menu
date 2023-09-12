"use strict";

const query = ```
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
```

const url = {
    api: "https://europlaza.pockethouse.io/api/graphql",
    token: "https://europlaza.pockethouse.io/oauth/token?grant_type=client_credentials&scope=read&redirect_uri=https://app.pockethouse.at&response-type=token",
};

require("dotenv").config();
const fetch = require("@11ty/eleventy-fetch");

module.exports = async function () {
    const europlazaAsset = fetch.RemoteAssetCache(url.api, { duration: "1d", type: "json" });

    if (europlazaAsset.isCacheValid()) {
        return await europlazaAsset.getCachedValue();
    }

    const token = await fetchAccessToken();

    
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