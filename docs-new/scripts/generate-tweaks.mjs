import fs from "fs"
import path from "path"

const tweaksDir = "../tweaks"
const docsDir = "content/docs/tweaks"
const tweaksIndexFile = "content/docs/tweaks/index.mdx"

fs.mkdirSync(docsDir, { recursive: true })

let tweaksList = []

const subfolders = fs
  .readdirSync(tweaksDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)

for (const folder of subfolders) {
  const metaPath = path.join(tweaksDir, folder, "meta.json")

  if (!fs.existsSync(metaPath)) {
    console.warn(`Skipping ${folder}, no meta.json found`)
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
    riskLevel === "safe" ? "#4caf50" :
    riskLevel === "risky" ? "#f44336" :
    riskLevel === "caution" ? "#ff9800" :
    "#9e9e9e"

  const escapeYaml = (str) => str.replace(/"/g, '\\"')

  const mdxContent = `---
title: "${escapeYaml(tweak.title || folder)}"
description: "${escapeYaml(tweak.description || "")}"
---

# ${tweak.title || folder}

## Overview
- **ID/URL**: \`${tweak.name || folder}\`
- **Description**: ${tweak.description || ""}
- **Risk Level**: <span style={{"color":"${riskColor}"}}>${formattedRiskLevel}</span>

${
  tweak.reversible === false
    ? `<Callout type="warn">
This tweak cannot be reversed and must be undone manually.
</Callout>`
    : ""
}

${
  tweak.updatedversion
    ? `<Callout>
This tweak was last updated in ${tweak.updatedversion}
</Callout>`
    : ""
}
${
  tweak.addedversion
    ? `<Callout>
This tweak was added in ${tweak.addedversion}, Sparkle ${tweak.addedversion}+ is required.
</Callout>`
    : ""
}
${deepDesc ? `## Details\n\n${deepDesc}` : ""}

${
  tweak.docs_warning
    ? `<Callout type="warn" title="Documentation Warning">
${tweak.docs_warning}
</Callout>`
    : ""
}
${
  tweak.warning
    ? `<Callout type="warn" title="Tweak Warning">
${tweak.warning}
</Callout>`
    : ""
}
${
  tweak.recommended
    ? `<Callout title="Recommended">
This tweak is recommended.
</Callout>`
    : ""
}

${applyScript ? `## Apply\n\n\`\`\`powershell\n${applyScript}\n\`\`\`\n` : ""}
${unapplyScript ? `## Unapply\n\n\`\`\`powershell\n${unapplyScript}\n\`\`\`\n` : ""}

${tweak.links ? `## Links\n${tweak.links.map((link) => `- [${link.name}](${link.url})`).join("\n")}` : ""}
`

  fs.writeFileSync(mdxPath, mdxContent.trim() + "\n", "utf-8")

  tweaksList.push({ name: tweak.name || folder, slug })
}

const tweaksIndex = `---
title: "List of All Tweaks"
description: "A collection of tweaks to customize and enhance your Windows experience using Sparkle."
---

# All Sparkle Tweaks

A collection of tweaks to customize and enhance your Windows experience using Sparkle.

_New to tweaks? Read [What Are Tweaks?](./what-are-tweaks) for an overview._

_This page is auto-generated._

## All Tweaks (${tweaksList.length})

${tweaksList.map((t) => `- [${t.name}](./${t.slug})`).join("\n")}
`

fs.writeFileSync(tweaksIndexFile, tweaksIndex.trim() + "\n", "utf-8")

console.log("Docs generated!")
console.log(`Total tweaks: ${tweaksList.length}`)
