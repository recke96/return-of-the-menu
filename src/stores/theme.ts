import { persistentAtom } from "@nanostores/persistent";

export type Themes = "light" | "dark" | "dracula";

export const $theme = persistentAtom<Themes | undefined>("$theme", undefined);