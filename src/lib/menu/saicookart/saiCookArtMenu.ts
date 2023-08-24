import formatDate from "date-fns/formatISO";
import { isSameDay } from "date-fns";
import type { Menu, MenuItem, MenuService } from "../menu";
import { getCacheItem } from "../../cache";
import corsProxy from "../../corsProxy";

class SaiCookArtMenuService implements MenuService {

    private alacarteItem: MenuItem = {
        id: "a la carte",
        title: "À la carte",
        description: '<a href="https://sai-cookart.at/delivery" target="_blank">Unsere Speisekarte</a>',
        price: 0,
        currency: "EUR"
    }

    private defaultMenu():Menu {
        return {
            restaurant: "Sai CookArt",
            items: [this.alacarteItem]
        };
    }

    async getMenus(date: Date): Promise<Menu[]> {
        const cacheKey = `sai.${formatDate(date)}`;
        const cacheMenu = getCacheItem<Menu>(cacheKey);
        if(!!cacheMenu) {
            return [cacheMenu];
        }
        const today = new Date();
        if (!isSameDay(date, today)) {
            return [this.defaultMenu()];
        }

        const url = corsProxy("https://api.sai-cookart.at/foods?active=true");
        const resp = await fetch(url);
        if (resp.status !== 200) {
            throw new Error(
                `Request for menu data resulted in a HTTP ${resp.status} code`
            );
        }

        const data = await resp.json() as SaiFood[];
        const menu = this.defaultMenu();

        data.filter(food => food.category.id === 2 /* Lunchmenu */)
            .flatMap(food => food.options.map((opt, idx) => ({
                id: `${food.id}.${idx}`,
                title: `${food.name.trim()} + ${opt.name.trim()}`,
                description: food.description,
                price: Number.parseFloat(opt.pricePickup),
                currency: "EUR"
            } as MenuItem)))
    }

}

type SaiFood = {
    id: number;
    name: string;
    description: string;
    spicy: boolean;
    vegan: boolean;
    vegetable: boolean;
    category: SaiCategory;
    options: SaiFoodOption[];
}

type SaiFoodOption = {
    is_available: boolean;
    name: string;
    allergy: string;
    description: string;
    pricePickup: string;
}

type SaiCategory = {
    id: number;
    name: string;
    description: string;
}