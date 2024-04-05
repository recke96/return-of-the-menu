import { persistentAtom } from "@nanostores/persistent";

export type Themes = "system" | "dark" | "light" | "dracula";

export const $theme = persistentAtom<Themes>("theme", "system");

$theme.subscribe((value, old) =>
  console.log("Theme changed: %s -> %s", old, value)
);
