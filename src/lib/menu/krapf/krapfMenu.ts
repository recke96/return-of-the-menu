import formatDate from "date-fns/formatISO";
import type {Menu, MenuItem, MenuService} from "../menu";
import {getCacheItem} from "../../cache";
import corsProxy from "../../corsProxy";
import {isSameWeek} from "date-fns";

const alacarteItem: MenuItem = {
    id: "a la carte",
    title: " À la carte",
    description: '<a href="https://gasthauskrapf.at/card.php#cardtop" target="_blank">Unsere Speisekarte</a>',
    price: 0,
    currency: "EUR"
}

class KrapfMenuService implements MenuService {
    async getMenus(date: Date): Promise<Menu[]> {
        const cacheKey = `krapf.${formatDate(date)}`;
        const menu = getCacheItem<Menu>(cacheKey);
        if (!!menu) {
            return [menu];
        }
        const today = new Date();
        if (!isSameWeek(date, today, {weekStartsOn: 1 /* monday */})) {
            return [{
                restaurant: "Krapf",
                items: [alacarteItem]
            }];
        }

        const url = corsProxy("https://gasthauskrapf.at/");
        const resp = await fetch(url);
        if (resp.status !== 200) {
            throw new Error(
                `Request for menu data resulted in a HTTP ${resp.status} code`
            );
        }

        const doc = new DOMParser().parseFromString(await resp.text(), "text/html");
        if (doc.querySelector("parsererror")) {
            console.error("failed to parse krapf HTML");
            return [];
        }

        return [{
            restaurant: "Krapf",
            items: [alacarteItem]
        }];
    }

    private scrape(doc: Document, today: Date): Menu {
        const dailymenu = doc.getElementById("dailymenu");
        const menuList = dailymenu.querySelector(".dailymenu-body > .container > .row > .dailymenu-overlay > small > .row > div > .row > div");

        for (let row in menuList.querySelectorAll(".row")) {
            console.log(row);
        }

        return {
            restaurant: "Krapf",
            items: []
        };
    }
}

export const krapfService = new KrapfMenuService();