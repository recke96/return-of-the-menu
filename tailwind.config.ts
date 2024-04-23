import type { Config } from "tailwindcss";
import Typography from "@tailwindcss/typography";
import DaisyUi from "daisyui";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  plugins: [Typography, DaisyUi],
  daisyui: {
    themes: ["light", "dark", "dracula"],
  },
} satisfies Config;
