import formatDate from "date-fns/formatISO";
import type {Menu, MenuItem, MenuService} from "../menu";
import {getCacheItem, setCacheItem} from "../../cache";
import corsProxy from "../../corsProxy";
import {isSameDay, isSameWeek, isValid} from "date-fns";
import {deAT} from "date-fns/locale";
import parseDate from "date-fns/parse";


class KrapfMenuService implements MenuService {

    private alacarteItem: MenuItem = {
        id: "a la carte",
        title: " À la carte",
        description: '<a href="https://gasthauskrapf.at/card.php#cardtop" target="_blank">Unsere Speisekarte</a>',
        price: 0,
        currency: "EUR"
    }

    private defaultMenu(): Menu {
        return {
            restaurant: "Krapf",
            items: [this.alacarteItem]
        };
    }

    async getMenus(date: Date): Promise<Menu[]> {
        const cacheKey = `krapf.${formatDate(date)}`;
        const menu = getCacheItem<Menu>(cacheKey);
        if (!!menu) {
            return [menu];
        }
        const today = new Date();
        if (!isSameWeek(date, today, {weekStartsOn: 1 /* monday */})) {
            return [this.defaultMenu()];
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
        const firstSplitter = doc.querySelector(
            '.dailymenu-overlay .dailymenu-splitter'
        );
        const container = firstSplitter.parentElement.parentElement;

        const parsedItems: (MenuItem & { date: Date | null, weeklySpecial: boolean })[] = [];
        let currentDate: Date | null = null;
        let dateMenuCount = 0;
        let weeklySpecial = false;

        for (let idx = 0; idx < container.childNodes.length; idx++) {
            const child = container.childNodes[idx];
            if (!child.hasChildNodes()) {
                continue;
            }
            const text = child.childNodes[1].textContent.trim();
            if (text === "") {
                continue;
            }

            // See if it is a date
            try {
                const parsedDate = parseDate(text, "EEEE", date, {locale: deAT});
                if (isValid(parsedDate)) {
                    currentDate = parsedDate;
                    dateMenuCount = 0;
                    continue;
                }
            } catch (e) {
                // not a date & not empty => menu item
            }

            // Weekly special handling
            if (text === "Wochenangebot") {
                weeklySpecial = true;
                currentDate = null;
                dateMenuCount = 0;
                continue;
            }

            if (weeklySpecial || isSameDay(date, currentDate)) {

                const description = text.replace(/^\d+\)/, "");
                const priceText = child.childNodes[3].textContent.replace(/,/, ".").replace(/[^\d.]/, "");
                const price = parseFloat(priceText);
                dateMenuCount++;

                parsedItems.push({
                    date: currentDate,
                    weeklySpecial,
                    id: weeklySpecial ? `weekly.${dateMenuCount}` : `daily.${dateMenuCount}`,
                    title: weeklySpecial ? "Wochenangebot" : `Tagesmenü ${dateMenuCount}`,
                    description,
                    price,
                    currency: "EUR"
                });
            }
        }

        const dateMenu = this.defaultMenu();
        dateMenu.items.push(...parsedItems.map(i => i as MenuItem))

        setCacheItem<Menu>(cacheKey, {data: dateMenu, expiresAt: Date.now() + 120 * 60 * 1000});

        return [dateMenu];
    }
}

export const krapfService = new KrapfMenuService();