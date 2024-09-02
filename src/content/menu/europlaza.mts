import {z} from "astro:content"
import type {Loader, LoaderContext} from "astro/loaders";
import {retry, handleAll, ExponentialBackoff, wrap, fallback} from "cockatiel";
import {addMinutes, endOfDay, startOfDay} from "date-fns";
import slugify from "slugify";
import * as cheerio from "cheerio/slim";
import {KnownRestaurantsSchema, MenuItemSchema, MoneySchema} from "./schema.mjs";
import {fromError} from "zod-validation-error";

const retryPolicy = retry(handleAll, {maxAttempts: 3, backoff: new ExponentialBackoff({initialDelay: 256})})

export interface EuroplazaUserConfig {
    readonly user: string;
    readonly password: string;
}

export interface EuroplazaLoaderOptions {
    readonly tokenEndpoint: string,
    readonly apiEndpoint: string;
}

export const DefaultEuroplazaLoaderOptions = {
    tokenEndpoint: "https://europlaza.pockethouse.io/oauth/token?grant_type=client_credentials&scope=read&redirect_uri=https://app.pockethouse.at&response-type=token",
    apiEndpoint: "https://europlaza.pockethouse.io/api/graphql",
    policy: retryPolicy,
} as EuroplazaLoaderOptions;

export function europlazaLoader(options: EuroplazaUserConfig & Partial<EuroplazaLoaderOptions>): Loader {
    const realizedOptions = Object.assign({}, DefaultEuroplazaLoaderOptions, options);
    return {
        name: "europlaza-loader",
        schema: MenuItemSchema,
        load: async (loaderCtx) => {
            const policy = wrap(
                fallback(handleAll, () => {
                    loaderCtx.logger.error("Failed to many times, aborting europlaza menu");
                }),
                retryPolicy,
            );
            await policy.execute(async ({attempt, signal}) => {
                if (attempt > 1) {
                    loaderCtx.logger.warn(`Attempt ${attempt}`);
                }

                const token = await fetchAccessToken(realizedOptions.user, realizedOptions.password, realizedOptions.tokenEndpoint, loaderCtx, signal);
                await fetchRestaurantData(token, realizedOptions.apiEndpoint, loaderCtx, signal);
            })
        }
    }
}

const jsonParsingPreprocessor = (value: any, ctx: z.RefinementCtx) => {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch (e) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: (e as Error).message
            })
        }
    }

    return value;
}

const CachedTokenSchema = z.preprocess(jsonParsingPreprocessor, z.object({
    expiresAt: z.string().datetime().transform((val) => new Date(val)),
    token: z.string(),
})).optional();

type CachedToken = z.infer<typeof CachedTokenSchema>;

async function fetchAccessToken(user: string, password: string, tokenEndpoint: string, ctx: LoaderContext, signal?: AbortSignal): Promise<string> {
    const now = new Date();
    const cacheKey = "europlaza-token";
    const cachedTokenStr = ctx.meta.get(cacheKey);
    const cachedToken = await CachedTokenSchema.parseAsync(cachedTokenStr);

    if (cachedToken && cachedToken.expiresAt < now) {
        ctx.logger.info(`fetchAccessToken - Cache-Hit:\n${JSON.stringify(cachedToken)}`)
        return cachedToken.token;
    }
    ctx.meta.delete(cacheKey);

    const auth = Buffer.from(`${user}:${password}`).toString("base64");
    const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials",
        signal: signal ?? null
    });

    const body = await response.json();
    ctx.logger.debug(`fetchAccessToken - Result ${response.status} ${response.statusText}:\n${JSON.stringify(body)}`);

    if (response.ok && "access_token" in body) {
        const entry = {
            expiresAt: addMinutes(now, 30),
            token: body.access_token,
        } as CachedToken;

        ctx.meta.set(cacheKey, JSON.stringify(entry));
        return entry!.token;
    }

    ctx.logger.error(`Unexpected result for fetchAccessToken: ${response.status} ${response.statusText}`);
    throw new Error();
}

const sanitize = (val: string) => cheerio.load(val).text();

const EuroplazaMenuItemSchema = z.object({
    id: z.coerce.string(),
    title: z.string().transform((val, _ctx) => sanitize(val).trim()),
    content: z.string().transform((val, _ctx) => sanitize(val).trim()),
    price: z.coerce.number(),
    currency: MoneySchema.shape.currency
});

const EuroplazaWeekdayMenuSchema = z.object({
    id: z.coerce.string(),
    date: z.string().date(),
    menuItems: z.array(EuroplazaMenuItemSchema)
});

const EuroplazaRestaurantSchema = z.object({
    id: z.coerce.string(),
    name: z.string(),
    weekdayMenus: z.array(EuroplazaWeekdayMenuSchema),
});

const EuroplazaRestaurantsSchema = z.object({
    restaurants: z.array(EuroplazaRestaurantSchema),
})

async function fetchRestaurantData(accessToken: string, apiEndpoint: string, ctx: LoaderContext, signal?: AbortSignal) {
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
        signal: signal ?? null,
    });

    const {data} = await response.json();

    ctx.logger.debug(`fetchRestaurantData - Result ${response.status} ${response.statusText}:\n${JSON.stringify(data)}`);

    if (!response.ok) {
        ctx.logger.error(`fetchRestaurantData - Unexpected result: ${response.status} ${response.statusText}`);
        throw new Error();
    }


    const restaurantsResult = await EuroplazaRestaurantsSchema.safeParseAsync(data);
    if (!restaurantsResult.success) {
        ctx.logger.error(fromError(restaurantsResult.error).toString());
        throw new Error();
    }

    for (const restaurant of restaurantsResult.data.restaurants) {
        const slug = slugify(restaurant.name, {lower: true, trim: true});
        const idResult = await KnownRestaurantsSchema.safeParseAsync(slug);
        if (!idResult.success) {
            ctx.logger.warn(`fetchRestaurantData - Encountered unknown restaurant "${restaurant.name}" (${slug}) - skipping`);
            continue;
        }

        for (const menu of restaurant.weekdayMenus) {
            for (const item of menu.menuItems) {
                const entryId = `${restaurant.id}/${menu.id}/${item.id}`;
                const data = await ctx.parseData({
                    id: entryId,
                    data: {
                        restaurant: idResult.data,
                        name: item.title,
                        description: item.content,
                        price: {
                            amount: item.price / 100,
                            currency: item.currency,
                        }
                    }
                });

                ctx.store.set({
                    id: entryId,
                    data: data,
                    digest: ctx.generateDigest(data)
                })
            }
        }
    }
}