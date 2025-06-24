import type { Loader } from "astro/loaders";
import { MenuItemSchema } from "./schema.ts";
import { loadEuroplazaMenu } from "./europlaza.ts";
import { loadSaiCookartMenu } from "./sai-cookart.ts";

export function menuLoader(): Loader {
  return {
    name: "menu-loader",
    schema: MenuItemSchema,
    load: async (ctx) => {
      const loading = await Promise.all([
        loadEuroplazaMenu({
          user: import.meta.env.EUROPLAZA_USER,
          password: import.meta.env.EUROPLAZA_PASSWORD,
          logger: ctx.logger.fork("europlaza-loader"),
          meta: ctx.meta,
        }),
        loadSaiCookartMenu({ logger: ctx.logger.fork("sai-cookart-loader") }),
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
    },
  };
}
