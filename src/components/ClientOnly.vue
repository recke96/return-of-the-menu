<script setup lang="ts">
import { onMounted, ref } from "vue";

const isClient = ref(false);
onMounted(() => (isClient.value = true));
</script>

<template>
  <slot v-if="isClient"></slot>
</template>
