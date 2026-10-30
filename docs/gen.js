import fs from "fs"
import path from "path"

const tweaksDir = "../tweaks"
const docsDir = "./docs/tweaks"
const tweaksIndexFile = "./docs/tweaks/index.md"

fs.mkdirSync(docsDir, { recursive: true })

const tweaksList = []

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

  const mdPath = path.join(docsDir, `${slug}.md`)
  const applyPath = path.join(tweaksDir, folder, "apply.ps1")
  const unapplyPath = path.join(tweaksDir, folder, "unapply.ps1")

  const applyScript = fs.existsSync(applyPath) ? fs.readFileSync(applyPath, "utf-8") : null

  const unapplyScript = fs.existsSync(unapplyPath) ? fs.readFileSync(unapplyPath, "utf-8") : null

  let deepDesc = tweak.deepDescription || ""

  deepDesc = deepDesc
    .split(/\n?(?=[^\n]+:\s*\*)/)
    .filter(Boolean)
    .map((section) => {
      const match = section.match(/^([^\n]+):\s*\*?/)

      if (match) {
        const title = match[1].trim()
        const content = section
          .slice(match[0].length)
          .split("- ")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `- ${s}`)
          .join("\n")

        return `## ${title}\n\n${content}`
      }

      return section.trim()
    })
    .join("\n\n")

  const riskLevel = tweak.risk || "unknown"

  const formattedRiskLevel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)

  const riskColor =
    riskLevel === "safe"
      ? "#4caf50"
      : riskLevel === "risky"
        ? "#f44336"
        : riskLevel === "caution"
          ? "#ff9800"
          : "#9e9e9e"

  const mdContent = `---
title: "${tweak.title || folder}"
---

# ${tweak.title || folder}

## Overview

- **ID/URL**: \`${tweak.name || folder}\`
- **Description**: ${tweak.description || ""}
- **Risk Level**: <span style="color:${riskColor}">${formattedRiskLevel}</span>

${
  tweak.reversible === false
    ? `::: info Irreversible

This tweak cannot be reversed and must be undone manually.

:::`
    : ""
}

${
  tweak.updatedversion
    ? `::: note Last Updated

This tweak was last updated in ${tweak.updatedversion}.

:::`
    : ""
}

${
  tweak.addedversion
    ? `::: note Added Version

This tweak was added in ${tweak.addedversion}, Sparkle ${tweak.addedversion}+ is required.

:::`
    : ""
}

${deepDesc ? `## Details\n\n${deepDesc}` : ""}

${
  tweak.docs_warning
    ? `::: warning Documentation Warning

${tweak.docs_warning}

:::`
    : ""
}

${
  tweak.warning
    ? `::: warning Tweak Warning

${tweak.warning}

:::`
    : ""
}

${
  tweak.recommended
    ? `::: tip Recommended

This tweak is recommended.

:::`
    : ""
}

${
  applyScript
    ? `## Apply

\`\`\`powershell
${applyScript}
\`\`\`
`
    : ""
}

${
  unapplyScript
    ? `## Unapply

\`\`\`powershell
${unapplyScript}
\`\`\`
`
    : ""
}

${
  tweak.links
    ? `## Links

${tweak.links.map((link) => `- [${link.name}](${link.url})`).join("\n")}
`
    : ""
}
`

  fs.writeFileSync(mdPath, mdContent.trim() + "\n", "utf-8")

  tweaksList.push({
    name: tweak.name || folder,
    title: tweak.title || folder,
    slug,
  })
}

const tweaksIndex = `---
title: "List of All Tweaks"
---

# All Sparkle Tweaks

A collection of tweaks to customize and enhance your Windows experience using Sparkle.

New to tweaks? Read [What Are Tweaks?](./what-are-tweaks) for an overview.

> [!NOTE]
> This page is auto-generated.

## All Tweaks (${tweaksList.length})

${tweaksList.map((t) => `- [${t.title}](/tweaks/${t.slug})`).join("\n")}
`

fs.writeFileSync(tweaksIndexFile, tweaksIndex.trim() + "\n", "utf-8")

console.log("✅ - Docs generated!")
console.log(`🛠️  - Total tweaks: ${tweaksList.length}`)
