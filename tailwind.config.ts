import type { Config } from "tailwindcss";
import DaisyUi from "daisyui";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  plugins: [DaisyUi],
  daisyui: {
    themes: ["light", "dark", "dracula"],
  },
} satisfies Config;
