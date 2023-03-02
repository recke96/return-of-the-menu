<script lang="ts">
  import { onMount } from "svelte";

  const storageKey = "theme";
  enum Theme {
    system = "system",
    light = "light",
    dark = "dark",
    dracula = "dracula",
  }

  type Themes = {
    [key in Theme]: {
      displayName: string;
      onActivate: () => void;
      onDeactivate: () => void;
      [key: string]: any;
    };
  };

  type ThemeClass = "light" | "dark" | "dracula";

  function addThemeClass(themeClass: ThemeClass) {
    document.body.classList.add(themeClass);
  }

  function removeThemeClasses(...themeClasses: ThemeClass[]) {
    document.body.classList.remove(...themeClasses);
  }

  const themes: Themes = {
    system: {
      displayName: "System",
      onActivate() {
        if (this.themePref.matches) {
          addThemeClass("dark");
        } else {
          addThemeClass("light");
        }
        this.themePref.addEventListener("change", this.changeListener);
      },
      onDeactivate() {
        this.themePref.removeEventListener("change", this.changeListener);
        removeThemeClasses("light", "dark");
      },
      themePref: window.matchMedia("(prefers-color-scheme: dark)"),
      changeListener(evt: MediaQueryListEvent) {
        if (evt.matches) {
          removeThemeClasses("light");
          addThemeClass("dark");
        } else {
          removeThemeClasses("dark");
          addThemeClass("light");
        }
      },
    },
    light: {
      displayName: "Light",
      onActivate: () => addThemeClass("light"),
      onDeactivate: () => removeThemeClasses("light"),
    },
    dark: {
      displayName: "Dark",
      onActivate: () => addThemeClass("dark"),
      onDeactivate: () => removeThemeClasses("dark"),
    },
    dracula: {
      displayName: "Dracula",
      onActivate: () => addThemeClass("dracula"),
      onDeactivate: () => removeThemeClasses("dracula"),
    },
  };

  function applyTheme(newTheme: Theme, oldTheme: Theme | undefined) {
    if (oldTheme) {
      themes[oldTheme].onDeactivate();
    }

    themes[newTheme].onActivate();
  }

  function loadThemeFromStorage(): Theme | undefined {
    const storedTheme = localStorage.getItem(storageKey);
    if (!storedTheme || !Object.values(Theme).includes(storedTheme as Theme)) {
      return undefined;
    }

    return storedTheme as Theme;
  }

  function storeTheme(theme: Theme) {
    localStorage.setItem(storageKey, theme);
  }

  let currentTheme = Theme.system;

  function switchTheme(event: Event) {
    const newTheme = (event.target as HTMLSelectElement)?.value as
      | Theme
      | undefined;
    if (!newTheme || !Object.values(Theme).includes(newTheme)) {
      return;
    }
    let storedTheme = loadThemeFromStorage();
    applyTheme(newTheme, storedTheme);
    storeTheme(newTheme);
    currentTheme = newTheme;
    console.log(storedTheme, newTheme);
  }

  onMount(() => {
    let storedTheme = loadThemeFromStorage();
    if (!storedTheme) {
      storedTheme = currentTheme;
      storeTheme(storedTheme);
    }
    applyTheme(storedTheme, undefined);
    currentTheme = storedTheme;
  });
</script>

<div class="grouped is-vertical-align">
  <label for="theme-picker">Theme</label>
  <select id="theme-picker" bind:value={currentTheme} on:change={switchTheme}>
    {#each Object.keys(themes) as themeKey (themeKey)}
      <option value={themeKey}>{themes[themeKey].displayName}</option>
    {/each}
  </select>
</div>

<style>
  :global(body.dark) {
    --bg-color: #1c1c1c;
    --bg-secondary-color: #131316;
    --font-color: #f5f5f5;
    --color-grey: #ccc;
    --color-darkGrey: #777;
  }
  :global(body.dracula) {
    --bg-color: #282a36;
    --bg-secondary-color: #44475a;
    --color-primary: #ff79c6;
    --font-color: #f8f8f2;
    --color-lightGrey: #d2d6dd;
    --color-grey: #ccc;
    --color-darkGrey: #777;
    --color-error: #ff5555;
    --color-success: #50fa7b;
    --font-family-sans: sans-serif;
    --font-family-mono: monaco, "Consolas", "Lucida Console", monospace;
  }
</style>
