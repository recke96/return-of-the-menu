import {z} from "astro:content";
import {createPolicy, htmlToText} from "./util.mjs";
import {type MenuItem, MenuItemSchema} from "./schema.mjs";
import {fromError} from "zod-validation-error";
import type {AstroIntegrationLogger} from "astro";

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

type SaiCookartLoaderRequiredConfig = {
    readonly logger: AstroIntegrationLogger;
};

type SaiCookartLoaderOptionalConfig = {
    readonly apiEndpoint: string;
};

export type SaiCookartLoaderConfig = SaiCookartLoaderRequiredConfig & Partial<SaiCookartLoaderOptionalConfig>;

export const DefaultSaiCookartLoaderOptions = {
    apiEndpoint: "https://api.sai-cookart.at/foods"
} as SaiCookartLoaderOptionalConfig;

export async function loadSaiCookartMenu(options: SaiCookartLoaderConfig): Promise<ReadonlyArray<MenuItem>> {
    const {apiEndpoint, logger} = Object.assign({}, DefaultSaiCookartLoaderOptions, options);
    const policy = createPolicy(logger);
    return await policy.execute(async ({attempt, signal}) => {
        if (attempt > 1) {
            logger.warn(`Attempt ${attempt}`);
        }

        const menuGenerator = fetchRestaurantData(apiEndpoint, logger, signal);
        return Array.fromAsync(menuGenerator);
    })
}

async function* fetchRestaurantData(apiEndpoint: string, logger: AstroIntegrationLogger, signal: AbortSignal): AsyncGenerator<MenuItem> {
    const params = new URLSearchParams({
        "active": "true",
        "category": "2", // menu
    });

    const response = await fetch(`${apiEndpoint}?${params}`, {
        signal: signal
    });

    const data = await response.json();

    logger.debug(`fetchRestaurantData - Result ${response.status} ${response.statusText}:\n${JSON.stringify(data)}`);

    if (!response.ok) {
        logger.error(`Unexpected result: ${response.status} ${response.statusText}`);
        throw new Error();
    }

    const foodsResult = await z.array(SaiFood).safeParseAsync(data);
    if (!foodsResult.success) {
        logger.error(fromError(foodsResult.error).toString());
        throw new Error();
    }

    for (const food of foodsResult.data) {
        const itemResult = await MenuItemSchema.safeParseAsync({
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
        });

        if (itemResult.success) {
            yield itemResult.data;
        } else {
            logger.warn(`Could not parse data: ${fromError(itemResult.error)}`)
        }
    }
}