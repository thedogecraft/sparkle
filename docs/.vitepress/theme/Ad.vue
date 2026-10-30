<script setup lang="ts">
import { onMounted } from "vue"

onMounted(() => {
  try {
    ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
    ;(window as any).adsbygoogle.push({})
  } catch (e) {
    console.error(e)
  }
})
</script>

<template>
  <div class="sparkle-ad">
    <ins
      class="adsbygoogle"
      style="display: block"
      data-ad-client="ca-pub-1565760898646999"
      data-ad-slot="3836598101"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  </div>
</template>

<style scoped>
.sparkle-ad {
  margin-top: 1.5rem;
}
</style>
