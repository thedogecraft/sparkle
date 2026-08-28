// Port of ../docs-new/index.js generator for Fumadocs.
// Reads Sparkle tweaks from ../tweaks/*/meta.json and generates
// Fumadocs MDX pages into ./content/docs/tweaks/.

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const root = path.dirname(fileURLToPath(import.meta.url))

const tweaksDir = path.join(root, "..", "tweaks")
const docsDir = path.join(root, "content", "docs", "tweaks")
const tweaksIndexFile = path.join(docsDir, "index.mdx")

fs.mkdirSync(docsDir, { recursive: true })

let tweaksList = []

const subfolders = fs
  .readdirSync(tweaksDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)

for (const folder of subfolders) {
  const metaPath = path.join(tweaksDir, folder, "meta.json")

  if (!fs.existsSync(metaPath)) {
    console.warn(`⚠️ Skipping ${folder}, no meta.json found`)
    continue
  }

  const tweak = JSON.parse(fs.readFileSync(metaPath, "utf-8"))

  const slug = tweak.name
    ? tweak.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : folder

  const mdxPath = path.join(docsDir, `${slug}.mdx`)

  const applyPath = path.join(tweaksDir, folder, "apply.ps1")
  const unapplyPath = path.join(tweaksDir, folder, "unapply.ps1")

  const applyScript = fs.existsSync(applyPath) ? fs.readFileSync(applyPath, "utf-8") : null
  const unapplyScript = fs.existsSync(unapplyPath) ? fs.readFileSync(unapplyPath, "utf-8") : null

  let deepDesc = tweak.deepDescription || ""
  deepDesc = deepDesc
    .split(/\n?([^\n]+:)\s*/g)
    .filter(Boolean)
    .map((section) => {
      if (section.endsWith(":")) {
        return `## ${section}`
      } else {
        return section
          .split(/- /)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `- ${s}`)
          .join("\n")
      }
    })
    .join("\n\n")

  const riskLevel = tweak.risk || "unknown"
  const formattedRiskLevel = riskLevel[0].toUpperCase() + riskLevel.slice(1)

  const riskColor =
    riskLevel === "safe"
      ? "#4caf50"
      : riskLevel === "risky"
        ? "#f44336"
        : riskLevel === "caution"
          ? "#ff9800"
          : "#9e9e9e"

  const pageTitle = (tweak.title || folder).replace(/"/g, '\\"')
  const pageDescription = (tweak.description || "").replace(/"/g, '\\"')

  const callouts = [
    tweak.reversible === false
      ? `<Callout title="Irreversible">
This tweak cannot be reversed and must be undone manually.
</Callout>`
      : "",
    tweak.updatedversion
      ? `<Callout type="info" title="Updated">
This tweak was last updated in ${tweak.updatedversion}.
</Callout>`
      : "",
    tweak.addedversion
      ? `<Callout type="info" title="Added">
This tweak was added in ${tweak.addedversion}, Sparkle ${tweak.addedversion}+ is required.
</Callout>`
      : "",
    tweak.docs_warning
      ? `<Callout type="warning" title="Documentation Warning">
${tweak.docs_warning}
</Callout>`
      : "",
    tweak.warning
      ? `<Callout type="warning" title="Tweak Warning">
${tweak.warning}
</Callout>`
      : "",
    tweak.recommended
      ? `<Callout type="idea" title="Recommended">
This tweak is recommended.
</Callout>`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  const linksSection = tweak.links
    ? `## Links\n\n${tweak.links.map((link) => `- [${link.name}](${link.url})`).join("\n")}`
    : ""

  const mdxContent = `---
title: "${pageTitle}"
description: "${pageDescription}"
---

## Overview

- **ID/URL**: \`${tweak.name || folder}\`
- **Description**: ${tweak.description || ""}
- **Risk Level**: <span style={{ color: "${riskColor}" }}>${formattedRiskLevel}</span>

${
  callouts
    ? `${callouts}\n\n`
    : ""
}${deepDesc ? `## Details\n\n${deepDesc}\n\n` : ""}${
    applyScript
      ? `## Apply\n\n\`\`\`powershell noCopy title="Apply"\n${applyScript}\n\`\`\`\n\n`
      : ""
  }${unapplyScript ? `## Unapply\n\n\`\`\`powershell noCopy title="Unapply"\n${unapplyScript}\n\`\`\`\n\n` : ""}${
    linksSection ? `${linksSection}\n` : ""
  }`

  fs.writeFileSync(mdxPath, mdxContent.trim() + "\n", "utf-8")

  tweaksList.push({ name: tweak.name || folder, slug, description: tweak.description || "" })
}

const tweaksIndex = `---
title: All Tweaks
description: A collection of tweaks to customize and enhance your Windows experience using Sparkle.
---

A collection of tweaks to customize and enhance your Windows experience using Sparkle.

This page is auto-generated.

## All Tweaks (${tweaksList.length})

<Cards>
${tweaksList
  .map(
    (t) => `  <Card
    href="${t.slug}"
    title={${JSON.stringify(t.name || "")}}
    description={${JSON.stringify(t.description || "")}}
  />`
  )
  .join("\n")}
</Cards>
`

fs.writeFileSync(tweaksIndexFile, tweaksIndex.trim() + "\n", "utf-8")

console.log("✅ - Docs generated!")
console.log(`🛠️  - Total tweaks: ${tweaksList.length}`)
