import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      EUROPLAZA_USER: envField.string({
        context: "server",
        access: "secret",
      }),
      EUROPLAZA_PASSWORD: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },
  vite: {
    ssr: {
      noExternal: ["chota"],
    },
  },
});
