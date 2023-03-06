import {europlazaService} from "./europlaza/europlazaMenu";

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
        return (await Promise.all(this.services.map(svc => svc.getMenus(date)))).flat();
    }
}

export const menuService: MenuService = new CompoundMenuService([
    europlazaService
]);
