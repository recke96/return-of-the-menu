import { z } from "astro:content";

export const schema = z.object({
  name: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
  }),
  homepage: z.string().url(),
  latLng: z.tuple([
    z.number().min(-90).max(+90),
    z.number().min(-180).max(+180),
  ]),
});
