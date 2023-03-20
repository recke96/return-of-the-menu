import formatDate from 'date-fns/formatISO';
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";
import {setCacheItem, getCacheItem} from "../../cache";
import query from './query.graphql?raw';
import corsProxy from "../../corsProxy";
import type {Menu, MenuItem, MenuService} from "../menu";


type EuroplazaRestaurant = {
    id: number;
    name: string;
    weekdayMenus: EuroplazaMenu[];
}

type EuroplazaMenu = {
    id: number;
    date: string;
    menuItems: EuroplazaMenuItem[];
}

type EuroplazaMenuItem = {
    id: number;
    title: string;
    content: string;
    price: number;
    currency: string;
}

class EuroplazaMenuService implements MenuService {
    async getMenus(date: Date): Promise<Menu[]> {
        const cacheKey = `europlaza.${formatDate(date)}`;
        let menus = getCacheItem<Menu[]>(cacheKey);
        if (!!menus) {
            return menus;
        }

        const token = await this.fetchAccessToken("***REMOVED***", "***REMOVED***");
        const resp = await fetch(
            corsProxy("https://europlaza.pockethouse.io/api/graphql"),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: this.menuRequestBody(date),
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
        menus = this.mapEuroplazaToUnified(data.data.restaurants);

        /* cache for 120 min */
        setCacheItem(cacheKey, {data: menus, expiresAt: Date.now() + 120 * 60 * 1000})

        return menus;
    }

    private async fetchAccessToken(username, password): Promise<string> {
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

    private menuRequestBody(date: Date) {
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

    private mapEuroplazaToUnified(restaurants: EuroplazaRestaurant[]): Menu[] {
        return restaurants.map(ep => ({
            restaurant: ep.name,
            items: ep.weekdayMenus.flatMap(wd => wd.menuItems.map(mi => ({
                id: mi.id.toString(),
                title: mi.title,
                description: mi.content,
                price: mi.price / 100,
                currency: mi.currency
            } as MenuItem)))
        }));
    }
}

export const europlazaService = new EuroplazaMenuService();