import { z, reference } from "astro:content";

export const MoneySchema = z.object({
  amount: z.coerce.number(),
  currency: z.string().length(3).toUpperCase().default("EUR"),
});

export type Money = z.infer<typeof MoneySchema>;

export const MenuItemOptionSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: MoneySchema,
});

export type MenuItemOption = z.infer<typeof MenuItemOptionSchema>;

export const KnownRestaurantsSchema = reference("restaurants");

export const MenuItemSchema = z.object({
  restaurant: KnownRestaurantsSchema,
  name: z.string(),
  description: z.string(),
  price: MoneySchema.nullable(),
  options: z.array(MenuItemOptionSchema),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;