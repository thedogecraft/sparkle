import fs from "fs/promises"
import path from "path"
import { execSync } from "child_process"
import readline from "readline"

const root = process.cwd()
const tweaksDir = path.join(root, "tweaks")
const registryPath = path.join(tweaksDir, "registry.json")
const registryScriptsPath = path.join(tweaksDir, "registry-scripts.json")
const distDir = path.join(root, "dist")

function askQuestion(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase())
    })
  })
}

async function buildRegistry() {
  const folders = await fs.readdir(tweaksDir)
  const registryNormal = []
  const registryScripts = []

  for (const folder of folders) {
    const tweakPath = path.join(tweaksDir, folder)
    const stat = await fs.stat(tweakPath).catch(() => null)
    if (!stat?.isDirectory()) continue

    const metaPath = path.join(tweakPath, "meta.json")
    const applyPath = path.join(tweakPath, "apply.ps1")
    const unapplyPath = path.join(tweakPath, "unapply.ps1")

    try {
      const metaRaw = await fs.readFile(metaPath, "utf8")
      const meta = JSON.parse(metaRaw)

      const baseTweak = {
        id: meta.name || folder,
        title: meta.title || folder,
        description: meta.description || "",
        category: meta.category || [],
        recommended: !!meta.recommended,
        reversible: meta.reversible !== false,
        addedversion: meta.addedversion,
        updatedversion: meta.updatedversion,
        docsurl: `https://docs.getsparkle.net/tweaks/${folder}`,
        source: `https://github.com/Parcoil/Sparkle/blob/v2/tweaks/${folder}/meta.json`,
      }

      registryNormal.push(baseTweak)

      let applyScript = null
      let unapplyScript = null

      try {
        applyScript = await fs.readFile(applyPath, "utf8")
      } catch {
        console.warn(`⚠️ No apply.ps1 found for ${folder}`)
      }

      if (baseTweak.reversible) {
        try {
          unapplyScript = await fs.readFile(unapplyPath, "utf8")
        } catch {
          console.warn(`⚠️ No unapply.ps1 found for ${folder}`)
        }
      }

      registryScripts.push({
        ...baseTweak,
        scripts: {
          apply: applyScript,
          unapply: unapplyScript,
        },
      })
    } catch (e) {
      console.error(`⚠️ Failed to read tweak in ${folder}: ${e.message}`)
    }
  }

  const timestamp = new Date().toISOString()

  const normalOutput = { version: timestamp, tweaks: registryNormal }
  await fs.writeFile(registryPath, JSON.stringify(normalOutput, null, 2))
  console.log(`✅ registry.json created at ${registryPath}`)

  const scriptsOutput = { version: timestamp, tweaks: registryScripts }
  await fs.writeFile(registryScriptsPath, JSON.stringify(scriptsOutput, null, 2))
  console.log(`✅ registry-scripts.json created at ${registryScriptsPath}`)
}

async function getSha256(filePath) {
  const hash = await crypto.subtle.digest("SHA-256", await fs.readFile(filePath))
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function findAndPrintHashes() {
  console.log("\n📦 Calculating checksums...")
  try {
    const files = await fs.readdir(distDir)
    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      if (ext === ".exe" || ext === ".zip") {
        const filePath = path.join(distDir, file)
        const sha256 = await getSha256(filePath)
        console.log(`   ${file}: ${sha256}`)
      }
    }
  } catch (e) {
    console.warn(`⚠️ Could not calculate hashes: ${e.message}`)
  }
}

function buildElectron() {
  console.log("🚀 Building Electron app...")
  execSync("pnpm run build:vite && electron-builder", { stdio: "inherit" })
}

const args = process.argv.slice(2)
const shouldBuildRegistry = args.includes("--registry") || args.length === 0
const shouldBuildApp = args.includes("--build") || args.length === 0

;(async () => {
  if (shouldBuildRegistry) {
    const answer = await askQuestion("Do you want to update the registry files? (y/N): ")
    if (answer === "y" || answer === "yes") {
      await buildRegistry()
    } else {
      console.log("⏭️  Skipping registry update")
    }
  }
  if (shouldBuildApp) {
    buildElectron()
    await findAndPrintHashes()
  }
})()
