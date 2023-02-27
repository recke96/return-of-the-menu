import formatDate from 'date-fns/formatISO';
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";
import {setCacheItem, getCacheItem} from "./cache";
import query from './query.graphql?raw';

function corsProxy(url: string): string {
    return "https://corsproxy.io/?" + encodeURIComponent(url);
}

async function fetchAccessToken(username, password): Promise<string> {
    const cacheKey = "accessToken";
    let cached = getCacheItem<string>(cacheKey);
    if (!!cached) {
        return cached;
    }

    const cred = `${username}:${password}`;
    const resp = await fetch(
        corsProxy(
            "https://europlaza.pockethouse.io/oauth/token?grant_type=client_credentials&scope=read&redirect_uri=https://app.pockethouse.at&response-type=token"
        ),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${btoa(cred)}`,
            },
            body: "grant_type=client_credentials",
        }
    );

    if (resp.status !== 200) {
        throw new Error(
            `Request for access token resulted in a HTTP ${resp.status} code`
        );
    }

    const data = await resp.json();

    if (
        typeof data.access_token !== "string" ||
        data.access_token.length === 0 ||
        typeof data.expires_in !== "number"
    ) {
        throw new Error("Could not get valid access token");
    }
    const expires = Date.now() + (Number.parseInt(data.expires_in) * 1000) - 5000;
    setCacheItem(cacheKey, {data: data.access_token, expiresAt: expires});

    return data.access_token;
}

function menuRequestBody(date: Date) {
    const fromDateStr = formatDate(startOfDay(date));
    const toDateStr = formatDate(endOfDay(date));

    return JSON.stringify({
        query: query,
        variables: {
            limit: 32768,
            offset: 0,
            from: fromDateStr,
            to: toDateStr,
        },
    });
}

export type Restaurant = {
    id: number;
    name: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    weekdayMenus: Menu[];
}

export type Menu = {
    id: number;
    date: string;
    menuItems: MenuItem[];
}

export type MenuItem = {
    id: number;
    title: string;
    content: string;
    allergens: string | null;
    price: number;
    currency: string;
    menuItemCategories: MenuItemCat[];
}

export type MenuItemCat = {
    id: number;
    name: string;
}

export async function fetchMenuData(date: Date): Promise<Restaurant[]> {
    const cacheKey = `restaurants.${formatDate(date)}`;
    const restaurants = getCacheItem<Restaurant[]>(cacheKey);
    if (!!restaurants) {
        return restaurants;
    }

    const token = await fetchAccessToken("***REMOVED***", "***REMOVED***");
    const resp = await fetch(
        corsProxy("https://europlaza.pockethouse.io/api/graphql"),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: menuRequestBody(date),
        }
    );

    if (resp.status !== 200) {
        throw new Error(
            `Request for menu data resulted in a HTTP ${resp.status} code`
        );
    }

    const data = await resp.json();

    if (
        typeof data.data !== "object" ||
        !Array.isArray(data.data.restaurants)
    ) {
        throw new Error("JSON response has invalid structure");
    }

    /* cache for 120 min */
    setCacheItem(cacheKey, {data: data.data.restaurants, expiresAt: Date.now() + 120 * 60 * 1000})

    return data.data.restaurants;
};