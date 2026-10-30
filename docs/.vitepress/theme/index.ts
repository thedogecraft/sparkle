// https://vitepress.dev/guide/custom-theme
import { h } from "vue"
import type { Theme } from "vitepress"
import DefaultTheme from "vitepress/theme"
import "./style.css"
import Icon from "./Icon.vue"
import NotFound from "./NotFound.vue"

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      "not-found": () => h(NotFound),
    })
  },
  enhanceApp({ app, router, siteData }) {
    app.component("Icon", Icon)
  },
} satisfies Theme
