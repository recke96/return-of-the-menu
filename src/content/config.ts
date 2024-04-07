import { defineCollection } from "astro:content";
import { schema as restaurantSchema } from "./restaurants/_schema";

export const collections = {
  restaurants: defineCollection({
    type: "data",
    schema: restaurantSchema,
  }),
};
