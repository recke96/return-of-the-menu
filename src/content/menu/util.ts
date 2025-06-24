import type {RefinementCtx} from "zod";
import * as cheerio from "cheerio/slim";
import type {AstroIntegrationLogger} from "astro";
import {ExponentialBackoff, fallback, handleAll, retry, wrap,} from "cockatiel";

/**
 * Converts HTML to plain text by removing all HTML tags and non-display text
 * such as JavaScript or CSS styles.
 * 
 * @param html The HTML fragment to convert
 * @returns Plain text with HTML tags and non-display text removed
 */
export const htmlToPlainText = (html: string): string => {
    // Load the HTML fragment
    const $ = cheerio.load(html);

    // Remove script and style tags and their contents
    $('script, style').remove();

    // Get the text content, preserving some structure
    // Replace block elements with line breaks
    $('br').replaceWith('\n');
    $('p, div, h1, h2, h3, h4, h5, h6, li').each(function() {
        $(this).append('\n');
    });

    // Get the text and normalize whitespace
    let text = $.text().trim();

    // First normalize newlines
    text = text.replace(/\n+/g, '\n');

    // Then normalize spaces (but preserve newlines)
    text = text.replace(/[ \t]+/g, ' ');

    // Clean up spaces around newlines
    text = text.replace(/ *\n */g, '\n');

    return text;
};

/**
 * Converts HTML to plain text for use with Zod transformations.
 * This function is maintained for backward compatibility.
 * 
 * @param arg The HTML string to convert
 * @param _ Zod refinement context (unused)
 * @returns Plain text with HTML tags and non-display text removed
 */
export const htmlToText = (arg: string, _: RefinementCtx): string =>
    htmlToPlainText(arg);

const retryPolicy = retry(handleAll, {
    maxAttempts: 3,
    backoff: new ExponentialBackoff({initialDelay: 256}),
});
export const createPolicy = (logger: AstroIntegrationLogger) =>
    wrap(
        fallback(handleAll, () => {
            logger.error("Failed to many times, aborting");
            return [];
        }),
        retryPolicy,
    );