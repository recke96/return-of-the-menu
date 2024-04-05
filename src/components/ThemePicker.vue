<script setup lang="ts">
import ThemeBtn from "./ThemeBtn.vue";
import { $theme } from "@stores/theme";
</script>

<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost">Theme</div>
    <div
      class="dropdown-content bg-base-200 text-base-content overflow-y-auto border shadow-2x1 w-56"
    >
      <div class="grid grid-cols-1 gap-3 p-3">
        <button
          class="outline-base-content text-start outline-offset-4"
          @click="$theme.set('system')"
        >
          System
        </button>
        <ThemeBtn theme="dark" @click="$theme.set('dark')" />
        <ThemeBtn theme="light" @click="$theme.set('light')" />
        <ThemeBtn theme="dracula" @click="$theme.set('dracula')" />
      </div>
    </div>
  </div>
</template>
