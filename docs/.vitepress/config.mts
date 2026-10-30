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
  lastUpdated: true,
  title: "Sparkle Docs",
  description: "Docs for Sparkle",
  cleanUrls: true,
  head: [
    [
      "link",
      {
        rel: "icon",
        href: "https://raw.githubusercontent.com/Parcoil/logos/refs/heads/main/logos/sparklelogo.png",
      },
    ],
    [
      "script",
      {
        async: "",
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1565760898646999",
        crossorigin: "anonymous",
      },
    ],
    [
      "script",
      {},
      `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_pXPMfdpgrBN9eT7hFmaRZIzLJuC87f3KeCwdlMi5p2W', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-08-30',
});`,
    ],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "https://raw.githubusercontent.com/Parcoil/logos/refs/heads/main/logos/sparklelogo.png",
    nav: [
      { text: "Home", link: "/" },
      { text: "Apps", link: "/apps" },
      { text: "Cleaner", link: "/cleaner" },
      { text: "Contributing", link: "/contributing" },
      { text: "Creating Tweaks", link: "/creating-tweaks" },
      { text: "DNS Manager", link: "/dns-manager" },
      { text: "Donations", link: "/donations" },
      { text: "Uninstall", link: "/uninstall" },
      { text: "Updates", link: "/updates" },
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
