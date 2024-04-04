import type { Config } from 'tailwindcss';
import Typography from '@tailwindcss/typography';

export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    plugins: [Typography],
} satisfies Config;