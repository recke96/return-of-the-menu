import { z, defineCollection } from "astro:content";
import { menuLoader } from "./menu/menu-loader.ts";

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
    ]),
  }),
});
const menu = defineCollection({
  loader: menuLoader(),
});

export const collections = { restaurants, menu };