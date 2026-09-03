import { defineConfig } from "vitepress"
import fs from "fs"
import path from "path"

const tweaksDir = path.resolve(__dirname, "../docs/tweaks")

const tweaks = fs
  .readdirSync(tweaksDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .filter((entry) => entry.name !== "index.md")
  .map((entry) => {
    const slug = entry.name.replace(/\.md$/, "")
    const content = fs.readFileSync(path.join(tweaksDir, entry.name), "utf-8")

    const titleMatch = content.match(/^title:\s*"(.+)"$/m)

    return {
      text: titleMatch?.[1] || slug,
      link: `/tweaks/${slug}`,
    }
  })
  .sort((a, b) => a.text.localeCompare(b.text))

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",

  title: "Sparkle Docs",
  description: "Docs for Sparkle",
  cleanUrls: true,
  head: [["link", { rel: "icon", href: "https://parcoil.com/sparklelogo.png" }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "https://parcoil.com/sparklelogo.png",
    nav: [
      { text: "Home", link: "/" },
      { text: "Apps", link: "/apps" },
      { text: "Cleaner", link: "/cleaner" },
      { text: "Contributing", link: "/contributing" },
      { text: "Creating Tweaks", link: "/creating-tweaks" },
      { text: "DNS Manager", link: "/dns-manager" },
      { text: "Donations", link: "/donations" },
      { text: "Uninstall", link: "/uninstall" },
      { text: "Utilities", link: "/utilities" },
      { text: "Tweaks", link: "/tweaks/what-are-tweaks/" },
    ],

    sidebar: [
      {
        text: "Tweaks",
        items: [
          {
            text: "All Tweaks",
            link: "/tweaks/",
          },
          ...tweaks,
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/thedogecraft/sparkle" }],
  },
})
