import { execSync, spawn } from "child_process"
import path from "path"
import fs from "fs"

const TIMEOUT = 15_000
const WAIT_BEFORE_CHECK = 8_000

const unpackedDir = path.join(process.cwd(), "dist", "win-unpacked")
const exe = path.join(unpackedDir, "sparkle.exe")

if (!fs.existsSync(exe)) {
  console.error(`Executable not found: ${exe}`)
  process.exit(1)
}

console.log(`Launching ${exe}...`)

let pid

try {
  const ps = `(Start-Process -FilePath '${exe}' -ArgumentList '--no-sandbox' -Verb RunAs -PassThru).Id`
  const output = execSync(`powershell -Command "${ps}"`, {
    encoding: "utf-8",
    windowsHide: true,
  }).trim()
  pid = Number(output)
  if (!pid) {
    console.error(`Failed to parse PID from PowerShell output: ${output}`)
    process.exit(1)
  }
  console.log(`Launched with PID ${pid}`)
} catch (err) {
  console.error(`Failed to launch: ${err.message}`)
  process.exit(1)
}

function isRunning(targetPid) {
  try {
    execSync(`tasklist /FI "PID eq ${targetPid}"`, { encoding: "utf-8", windowsHide: true })
    return true
  } catch {
    return false
  }
}

setTimeout(() => {
  if (isRunning(pid)) {
    console.log("App is still running after smoke test - PASS")
    try {
      execSync(`powershell -Command "Stop-Process -Id ${pid} -Force"`, { stdio: "pipe", windowsHide: true })
    } catch {}
    process.exit(0)
  } else {
    console.error("App crashed or exited before smoke test completed - FAIL")
    process.exit(1)
  }
}, WAIT_BEFORE_CHECK)

setTimeout(() => {
  console.error("Smoke test timed out - FAIL")
  try {
    execSync(`powershell -Command "Stop-Process -Id ${pid} -Force"`, { stdio: "pipe", windowsHide: true })
  } catch {}
  process.exit(1)
}, TIMEOUT)
