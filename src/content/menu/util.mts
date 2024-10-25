import type { RefinementCtx } from "zod";
import * as cheerio from "cheerio/slim";
import type { AstroIntegrationLogger } from "astro";
import {
  ExponentialBackoff,
  fallback,
  handleAll,
  retry,
  wrap,
} from "cockatiel";

export const sanitize = (val: string) => {
  const fragment = cheerio.load(val);
  return fragment().prop("innerText") ?? "";
};

export const htmlToText = (arg: string, _: RefinementCtx): string =>
  sanitize(arg);

const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({ initialDelay: 256 }),
});
export const createPolicy = (logger: AstroIntegrationLogger) =>
  wrap(
    fallback(handleAll, () => {
      logger.error("Failed to many times, aborting");
      return [];
    }),
    retryPolicy,
  );
