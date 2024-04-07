import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import {
  startOfWeek,
  endOfWeek,
  interval,
  eachDayOfInterval,
  isWeekend,
  format,
  parse,
} from "date-fns";
import { deAT } from "date-fns/locale";
import { EuroplazaRestaurantService } from "src/services/Europlaza";

const fmt = "yyyy-MM-dd";

export const GET: APIRoute = async ({ params, props }) => {
  const svc = new EuroplazaRestaurantService(
    import.meta.env.EUROPLAZA_USER,
    import.meta.env.EUROPLAZA_PASSWORD
  );

  const today = new Date();
  const date = parse(params.date ?? "", fmt, today, {
    weekStartsOn: 1,
    locale: deAT,
  });
  const { entry } = props;
  const menu = await svc.getMenu(entry.id, date);

  return new Response(JSON.stringify(menu), {
    headers: { "Content-Type": "application/json" },
  });
};

export async function getStaticPaths() {
  const today = new Date();

  const days = eachDayOfInterval(
    interval(
      startOfWeek(today, { weekStartsOn: 1 }),
      endOfWeek(today, { weekStartsOn: 1 })
    )
  ).filter((d) => !isWeekend(d));

  const restaurants = await getCollection("restaurants");
  return restaurants.flatMap((entry) =>
    days.map((d) => ({
      params: { slug: entry.id, date: format(d, fmt) },
      props: { entry },
    }))
  );
}
