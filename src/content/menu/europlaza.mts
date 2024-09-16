import { type MetaStore, z } from "astro:content";
import { addMinutes, endOfDay, startOfDay } from "date-fns";
import slugify from "slugify";
import {
  KnownRestaurantsSchema,
  type MenuItem,
  MenuItemSchema,
  MoneySchema,
} from "./schema.mjs";
import { fromError } from "zod-validation-error";
import { createPolicy, htmlToText } from "./util.mts";
import type { AstroIntegrationLogger } from "astro";

type EuroplazaRequiredConfig = {
  readonly user: string;
  readonly password: string;
  readonly logger: AstroIntegrationLogger;
  readonly meta: MetaStore;
};

type EuroplazaOptionalConfig = {
  readonly tokenEndpoint: string;
  readonly apiEndpoint: string;
};

export type EuroplazaConfig = EuroplazaRequiredConfig &
  Partial<EuroplazaOptionalConfig>;

export const DefaultEuroplazaLoaderOptions = {
  tokenEndpoint:
    "https://europlaza.pockethouse.io/oauth/token?grant_type=client_credentials&scope=read&redirect_uri=https://app.pockethouse.at&response-type=token",
  apiEndpoint: "https://europlaza.pockethouse.io/api/graphql",
} as EuroplazaOptionalConfig;

export async function loadEuroplazaMenu(
  options: EuroplazaConfig,
): Promise<Array<MenuItem>> {
  const { logger, meta, apiEndpoint, tokenEndpoint, user, password } =
    Object.assign({}, DefaultEuroplazaLoaderOptions, options);

  const policy = createPolicy(logger);
  return await policy.execute(async ({ attempt, signal }) => {
    if (attempt > 1) {
      logger.warn(`Attempt ${attempt}`);
    }

    const token = await fetchAccessToken(
      user,
      password,
      tokenEndpoint,
      logger,
      meta,
      signal,
    );
    const menuGenerator = fetchRestaurantData(
      token,
      apiEndpoint,
      logger,
      signal,
    );

    return await Array.fromAsync(menuGenerator);
  });
}

const jsonParsingPreprocessor = (value: any, ctx: z.RefinementCtx) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: (e as Error).message,
      });
    }
  }

  return value;
};

const CachedTokenSchema = z
  .preprocess(
    jsonParsingPreprocessor,
    z.object({
      expiresAt: z
        .string()
        .datetime()
        .transform((val) => new Date(val)),
      token: z.string(),
    }),
  )
  .optional();

type CachedToken = z.infer<typeof CachedTokenSchema>;

async function fetchAccessToken(
  user: string,
  password: string,
  tokenEndpoint: string,
  logger: AstroIntegrationLogger,
  meta: MetaStore,
  signal: AbortSignal,
): Promise<string> {
  const now = new Date();
  const cacheKey = "europlaza-token";
  const cachedTokenStr = meta.get(cacheKey);
  const cachedToken = await CachedTokenSchema.parseAsync(cachedTokenStr);

  if (cachedToken && cachedToken.expiresAt > now) {
    logger.info(`Cache-Hit:\n${JSON.stringify(cachedToken)}`);
    return cachedToken.token;
  }
  meta.delete(cacheKey);

  const auth = Buffer.from(`${user}:${password}`).toString("base64");
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
    signal: signal,
  });

  const body = await response.json();
  logger.debug(
    `Access-Token-Result ${response.status} ${response.statusText}:\n${JSON.stringify(body)}`,
  );

  if (response.ok && "access_token" in body) {
    const entry = {
      expiresAt: addMinutes(now, 30),
      token: body.access_token,
    } as CachedToken;

    meta.set(cacheKey, JSON.stringify(entry));
    return entry!.token;
  }

  logger.error(`Unexpected result: ${response.status} ${response.statusText}`);
  throw new Error();
}

const EuroplazaMenuItemSchema = z.object({
  id: z.coerce.string(),
  title: z.string().transform(htmlToText),
  content: z.string().transform(htmlToText),
  price: z.coerce.number(),
  currency: MoneySchema.shape.currency,
});

const EuroplazaWeekdayMenuSchema = z.object({
  id: z.coerce.string(),
  date: z.string().date(),
  menuItems: z.array(EuroplazaMenuItemSchema),
});

const EuroplazaRestaurantSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  weekdayMenus: z.array(EuroplazaWeekdayMenuSchema),
});

const EuroplazaRestaurantsSchema = z.object({
  restaurants: z.array(EuroplazaRestaurantSchema),
});

async function* fetchRestaurantData(
  accessToken: string,
  apiEndpoint: string,
  logger: AstroIntegrationLogger,
  signal: AbortSignal,
): AsyncGenerator<MenuItem> {
  const query = `
    query ($limit: Int!, $offset: Int!, $from: String!, $to: String!) {
        restaurants: getAllRestaurants(limit: $limit, offset: $offset) {
            id
            name
            weekdayMenus(startDate: $from, endDate: $to) {
                id
                date
                menuItems {
                    id
                    title
                    content
                    price
                    currency
                }
            }
        }
    }`;

  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const reqBody = {
    query: query,
    variables: {
      limit: 50,
      offset: 0,
      from: start,
      to: end,
    },
  };

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(reqBody),
    signal: signal,
  });

  const { data } = await response.json();

  logger.debug(
    `Result ${response.status} ${response.statusText}:\n${JSON.stringify(data)}`,
  );

  if (!response.ok) {
    logger.error(
      `Unexpected result: ${response.status} ${response.statusText}`,
    );
    throw new Error();
  }

  const restaurantsResult =
    await EuroplazaRestaurantsSchema.safeParseAsync(data);
  if (!restaurantsResult.success) {
    logger.error(fromError(restaurantsResult.error).toString());
    throw new Error();
  }

  for (const restaurant of restaurantsResult.data.restaurants) {
    const slug = slugify(restaurant.name, { lower: true, trim: true });
    const idResult = await KnownRestaurantsSchema.safeParseAsync(slug);
    if (!idResult.success) {
      logger.warn(
        `Encountered unknown restaurant "${restaurant.name}" (${slug}) - skipping`,
      );
      continue;
    }

    for (const menu of restaurant.weekdayMenus) {
      for (const item of menu.menuItems) {
        const itemResult = await MenuItemSchema.safeParseAsync({
          restaurant: idResult.data,
          name: item.title,
          description: item.content,
          price: {
            amount: item.price / 100,
            currency: item.currency,
          },
          options: [],
        });

        if (itemResult.success) {
          yield itemResult.data;
        } else {
          logger.warn(`Could not parse data: ${fromError(itemResult.error)}`);
        }
      }
    }
  }
}
