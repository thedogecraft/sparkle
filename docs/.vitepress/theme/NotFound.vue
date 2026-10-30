<script setup>
import { withBase } from "vitepress"
</script>

<template>
  <div class="NotFound">
    <p class="code">404</p>
    <h1 class="title">Page not found</h1>
    <p class="message">The docs may not be up to date with the latest Sparkle version yet. Check back later!</p>
    <div class="actions">
      <a class="action primary" :href="withBase('/')">Back to home</a>
      <a class="action" href="https://github.com/thedogecraft/sparkle">Sparkle GitHub</a>
    </div>
  </div>
</template>

<style scoped>
.NotFound {
  padding: 96px 24px 168px;
  text-align: center;
}

.code {
  margin: 0;
  font-size: 5rem;
  font-weight: 600;
  line-height: 1;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.message {
  margin: 1rem auto 0;
  max-width: 32rem;
  color: var(--vp-c-text-2);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding-top: 24px;
}

.action {
  display: inline-block;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius);
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  transition:
    border-color 0.25s,
    color 0.25s;
}

.action:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.action.primary {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.action.primary:hover {
  border-color: var(--vp-c-brand-2);
  background-color: var(--vp-c-brand-2);
  color: var(--vp-c-white);
}
</style>
