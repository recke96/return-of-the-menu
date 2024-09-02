import {z, defineCollection} from "astro:content";
// import {europlazaLoader} from "./menu/europlaza.mjs";
// import {EUROPLAZA_PASSWORD, EUROPLAZA_USER} from "astro:env/server";
import {saiCookartLoader} from "./menu/sai-cookart.mjs";

const restaurants = defineCollection({
    type: "data",
    schema: z.object({
        name: z.string(),
        address: z.object({
            street: z.string(),
            city: z.string(),
        }),
        homepage: z.string().url(),
        latLng: z.tuple([
            z.number().gte(-90).lte(90),
            z.number().gte(-180).lte(180),
        ])
    })
})
const menu = defineCollection({
    type: "content_layer",
    loader: saiCookartLoader()
});

export const collections = {restaurants, menu}