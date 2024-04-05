<script setup lang="ts">
import ThemeDemo from "@components/ThemeDemo.vue";
import { useStore } from "@nanostores/vue";
import { $theme } from "@stores/theme";
import { onMounted, ref } from "vue";

const activeTheme = useStore($theme);

// Avoid hydration mismatch
const isClient = ref(false);
onMounted(() => (isClient.value = true));
</script>

<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost">Theme</div>
    <div
      class="dropdown-content rounded-box bg-base-200 text-base-content outline outline-1 outline-black/5 overflow-y-auto border shadow-2x1 w-56"
    >
      <div v-if="isClient" class="grid grid-cols-1 gap-3 p-3">
        <button
          class="outline-base-content text-start outline-offset-4"
          @click="$theme.set('system')"
        >
          <ThemeDemo theme="system" :active-theme />
        </button>
        <button
          class="outline-base-content outline-offset-4 text-start"
          @click="$theme.set('dark')"
        >
          <ThemeDemo theme="dark" :active-theme />
        </button>
        <button
          class="outline-base-content outline-offset-4 text-start"
          @click="$theme.set('light')"
        >
          <ThemeDemo theme="light" :active-theme />
        </button>
        <button
          class="outline-base-content outline-offset-4 text-start"
          @click="$theme.set('dracula')"
        >
          <ThemeDemo theme="dracula" :active-theme />
        </button>
      </div>
    </div>
  </div>
</template>
