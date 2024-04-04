import { persistentAtom } from "@nanostores/persistent";

export const $theme = persistentAtom<string | undefined>("theme");
