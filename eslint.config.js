// @ts-check

import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import astroEslint from "eslint-plugin-astro";

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.strictTypeChecked,
  ...astroEslint.configs["flat/recommended"],
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
