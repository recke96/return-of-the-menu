import {europlazaService} from "./europlaza/europlazaMenu";
import {krapfService} from "./krapf/krapfMenu";
import { saiCookArtService } from "./saicookart/saiCookArtMenu";

export type HtmlString = string;

export type MenuItem = {
    id: string;
    title: string;
    description: HtmlString;
    price: number;
    currency: string;
}

export type Menu = {
    restaurant: string;
    items: MenuItem[];
}

/**
 * How to get menus.
 */
export interface MenuService {
    /**
     * Get the menus of a given date.
     * @param date the date
     */
    getMenus(date: Date): Promise<Menu[]>;
}

class CompoundMenuService implements MenuService {

    private services: MenuService[];
    constructor(services: MenuService[]) {
        this.services = services;
    }

    async getMenus(date: Date): Promise<Menu[]> {
        const fetches = this.services.map(svc => svc.getMenus(date).catch(e => {
            console.error(e);
            return [];
        }));
        const menus = await Promise.all(fetches);
        return menus.flat();
    }
}

export const menuService: MenuService = new CompoundMenuService([
    europlazaService,
    krapfService,
    saiCookArtService,
]);
