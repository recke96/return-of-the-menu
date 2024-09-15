import type {Loader} from "astro/loaders";
import {MenuItemSchema} from "./schema.mjs";
import {loadEuroplazaMenu} from "./europlaza.mjs";
import {EUROPLAZA_PASSWORD, EUROPLAZA_USER} from "astro:env/server";
import {loadSaiCookartMenu} from "./sai-cookart.mjs";

export function menuLoader(): Loader {
    return {
        name: "menu-loader",
        schema: MenuItemSchema,
        load: async (ctx) => {

            const loading = await Promise.all([
                loadEuroplazaMenu({
                    user: EUROPLAZA_USER,
                    password: EUROPLAZA_PASSWORD,
                    logger: ctx.logger.fork("europlaza-loader"),
                    meta: ctx.meta
                }),
                loadSaiCookartMenu({logger: ctx.logger.fork("sai-cookart-loader")})
            ]);

            for (const item of loading.flat()) {
                const id = `${item.restaurant}/${item.name}`;
                const digest = ctx.generateDigest(item);
                ctx.store.set({
                    id: id,
                    data: item,
                    digest: digest,
                });
            }

        }
    }
}