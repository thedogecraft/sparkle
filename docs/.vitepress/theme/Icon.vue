<script setup>
import * as icons from "@lucide/vue"

const props = defineProps({
  name: String,
  size: {
    type: Number,
    default: 18,
  },
})

const icon = icons[props.name]
</script>

<template>
  <component :is="icon" :size="size" />
</template>
