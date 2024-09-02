import {z} from "astro:content";
import {createPolicy, htmlToText} from "./util.mjs";
import type {Loader, LoaderContext} from "astro/loaders";
import {MenuItemSchema} from "./schema.mjs";
import {fromError} from "zod-validation-error";

const SaiCategory = z.object({
    id: z.coerce.string(),
    name: z.string(),
    description: z.string().transform(htmlToText),
    active: z.boolean(),
    sort: z.coerce.number(),
    published_at: z.string().datetime(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

const SaiOption = z.object({
    is_available: z.boolean(),
    name: z.string(),
    description: z.string().transform(htmlToText),
    allergy: z.string(),
    order: z.coerce.number(),
    pricePickup: z.coerce.number(),
    priceDelivery: z.coerce.number(),
});

const SaiFood = z.object({
    id: z.coerce.string(),
    name: z.string(),
    description: z.string().transform(htmlToText),
    allergy: z.string(),
    spicy: z.boolean(),
    vegan: z.boolean(),
    vegetable: z.boolean(),
    category: SaiCategory,
    options: z.array(SaiOption).default([]),
    price: z.coerce.number(),
    price_delivery: z.coerce.number(),
    active: z.boolean(),
    published_at: z.string().datetime(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export interface SaiCookartLoaderOptions {
    readonly apiEndpoint: string;
}

export const DefaultSaiCookartLoaderOptions = {
    apiEndpoint: "https://api.sai-cookart.at/foods"
} as SaiCookartLoaderOptions;

export function saiCookartLoader(options?: Partial<SaiCookartLoaderOptions>): Loader {
    const realizedOptions = Object.assign({}, DefaultSaiCookartLoaderOptions, options);
    return {
        name: "saicookart-loader",
        schema: MenuItemSchema,
        load: async (loaderCtx) => {
            const policy = createPolicy(loaderCtx.logger);
            await policy.execute(async ({attempt, signal}) => {
                if (attempt > 1) {
                    loaderCtx.logger.warn(`Attempt ${attempt}`);
                }

                await fetchRestaurantData(realizedOptions.apiEndpoint, loaderCtx, signal);
            })
        }
    }
}

async function fetchRestaurantData(apiEndpoint: string, ctx: LoaderContext, signal?: AbortSignal) {
    const params = new URLSearchParams({
        "active": "true",
        "category": "2"
    });

    const response = await fetch(`${apiEndpoint}?${params}`, {
        signal: signal ?? null
    });

    const data = await response.json();

    ctx.logger.debug(`fetchRestaurantData - Result ${response.status} ${response.statusText}:\n${JSON.stringify(data)}`);

    if (!response.ok) {
        ctx.logger.error(`fetchRestaurantData - Unexpected result: ${response.status} ${response.statusText}`);
        throw new Error();
    }

    const foodsResult = await z.array(SaiFood).safeParseAsync(data);
    if (!foodsResult.success) {
        ctx.logger.error(fromError(foodsResult.error).toString());
        throw new Error();
    }

    for (const food of foodsResult.data) {
        const entryId = `sai/${food.id}`;
        const data = await ctx.parseData({
            id: entryId,
            data: {
                restaurant: "sai-cookart",
                name: food.name,
                description: food.description,
                price: food.options.length > 0
                    ? null
                    : {amount: food.price, currency: "EUR"},
                options: food.options.length <= 0
                    ? []
                    : food.options.map(opt => ({
                        name: opt.name,
                        description: opt.description,
                        price: {
                            amount: opt.pricePickup,
                            currency: "EUR",
                        }
                    })),
            }
        });

        ctx.store.set({
            id: entryId,
            data: data,
            digest: ctx.generateDigest(data),
        })
    }
}