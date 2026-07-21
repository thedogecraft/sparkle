import log from "electron-log"
import { TtlCache } from "@main/cache"
import type { NvidiaDriverInfo } from "../types"

export type { NvidiaDriverInfo }

// Undocumented but stable endpoints that GeForce Experience and nvidia.com's
// own driver-download page use. Verified live: they return real, current
// data (a July 2026 driver build with a genuine us.download.nvidia.com URL),
// but nothing here is guaranteed by Nvidia, so every call is wrapped and a
// failure just means "lookup unsupported" rather than a thrown error.
const LOOKUP_BASE = "https://www.nvidia.com/Download/API/lookupValueSearch.aspx"
const DRIVER_LOOKUP_URL =
  "https://gfwsl.geforce.com/services_toolkit/services/com/nvidia/services/AjaxDriverService.php"
const WINDOWS_11_OS_ID = 135

export interface LookupValue {
  name: string
  value: number
}

const seriesCache = new TtlCache<LookupValue[]>(24 * 60 * 60 * 1000)
const productCache = new TtlCache<LookupValue[]>(24 * 60 * 60 * 1000)

async function fetchLookupValues(typeId: number, parentId?: number): Promise<LookupValue[]> {
  const url = `${LOOKUP_BASE}?TypeID=${typeId}${parentId ? `&ParentID=${parentId}` : ""}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`lookupValueSearch HTTP ${res.status}`)
  const xml = await res.text()
  const values: LookupValue[] = []
  const re = /<LookupValue[^>]*>\s*<Name>([^<]*)<\/Name>\s*<Value>([^<]*)<\/Value>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    values.push({ name: match[1], value: Number(match[2]) })
  }
  return values
}

// GPU model strings from `systeminformation` look like "NVIDIA GeForce RTX
// 4070"; Nvidia's own series names look like "GeForce RTX 40 Series". This
// derives the series token ("RTX 40", "GTX 16", "RTX 20"...) from the model
// name and matches it against the live series list, rather than hardcoding a
// psid table that would go stale the moment a new GPU generation ships.
export function deriveSeriesToken(model: string): string | null {
  const m = model.toUpperCase()
  const match = m.match(/(RTX|GTX|MX|TITAN)\s*(\d{2,4})/)
  if (!match) return null
  const [, prefix, digits] = match
  // Series buckets by the first two digits of the model number, e.g.
  // "4070" -> "40", "1660" -> "16", "3090" -> "30".
  const seriesDigits = digits.length >= 4 ? digits.slice(0, 2) : digits.slice(0, digits.length - 1)
  return `${prefix} ${seriesDigits}`
}

export function matchSeries(series: LookupValue[], token: string, isLaptop: boolean): LookupValue | null {
  const candidates = series.filter((s) => s.name.toUpperCase().includes(token))
  if (candidates.length === 0) return null

  const laptopMatch = candidates.find((s) => /notebook/i.test(s.name))
  const desktopMatch = candidates.find((s) => !/notebook/i.test(s.name))
  return (isLaptop ? (laptopMatch ?? desktopMatch) : (desktopMatch ?? laptopMatch)) ?? null
}

export function matchProduct(products: LookupValue[], model: string): LookupValue | null {
  const normalize = (s: string) => s.toUpperCase().replace(/^NVIDIA\s+/, "").trim()
  const normalized = normalize(model)

  const exact = products.find((p) => normalize(p.name) === normalized)
  if (exact) return exact

  // Fall back to a substring match if the exact string didn't line up
  // (vendors sometimes suffix names differently, e.g. "Laptop GPU").
  const partial = products.find(
    (p) => normalized.includes(normalize(p.name)) || normalize(p.name).includes(normalized),
  )
  return partial ?? null
}

async function resolveSeriesId(model: string, isLaptop: boolean): Promise<number | null> {
  const token = deriveSeriesToken(model)
  if (!token) return null

  let series = seriesCache.get("geforce")
  if (!series) {
    series = await fetchLookupValues(2, 1) // ParentID=1 = GeForce product type
    seriesCache.set("geforce", series)
  }

  return matchSeries(series, token, isLaptop)?.value ?? null
}

async function resolveProductId(seriesId: number, model: string): Promise<number | null> {
  let products = productCache.get(String(seriesId))
  if (!products) {
    products = await fetchLookupValues(3, seriesId)
    productCache.set(String(seriesId), products)
  }

  return matchProduct(products, model)?.value ?? null
}

async function fetchLatestDriver(
  psid: number,
  pfid: number,
): Promise<Pick<NvidiaDriverInfo, "latestVersion" | "releaseDate" | "downloadUrl" | "downloadSizeText">> {
  const url =
    `${DRIVER_LOOKUP_URL}?func=DriverManualLookup&psid=${psid}&pfid=${pfid}` +
    `&osID=${WINDOWS_11_OS_ID}&languageCode=1033&beta=0&isWHQL=1&dltype=-1&dch=1&sort1=1&numberOfResults=1`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`driver lookup HTTP ${res.status}`)
  const json = await res.json()
  const hit = json?.IDS?.[0]?.downloadInfo
  if (!hit) throw new Error("no driver entries in response")
  return {
    latestVersion: hit.Version,
    releaseDate: hit.ReleaseDateTime,
    downloadUrl: hit.DownloadURL,
    downloadSizeText: hit.DownloadURLFileSize,
  }
}

// Deliberately does not compute a needsUpdate boolean: Nvidia's branch
// version (e.g. "610.74") and Windows' DriverVersion registry format (e.g.
// "32.0.15.6107") don't map onto each other reliably enough to trust a
// silent yes/no here, and there's no Nvidia GPU available to verify the
// comparison against. Both versions are returned so the UI can show them
// side by side and let the user judge, rather than assert a possibly-wrong
// answer.
export async function checkNvidiaDriverUpdate(
  model: string,
  installedVersion: string,
  isLaptop: boolean,
): Promise<NvidiaDriverInfo> {
  try {
    const seriesId = await resolveSeriesId(model, isLaptop)
    if (!seriesId) return { supported: false, reason: "Unrecognized GPU series", installedVersion }

    const productId = await resolveProductId(seriesId, model)
    if (!productId) return { supported: false, reason: "Unrecognized GPU model", installedVersion }

    const latest = await fetchLatestDriver(seriesId, productId)
    return { supported: true, installedVersion, ...latest }
  } catch (err: any) {
    log.warn("[Sparkle main/nvidiaDriver.ts]: lookup failed:", err?.message ?? err)
    return { supported: false, reason: "Lookup unavailable", installedVersion }
  }
}
