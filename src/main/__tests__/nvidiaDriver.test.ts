import { describe, it, expect } from "vitest"
import { deriveSeriesToken, matchSeries, matchProduct, type LookupValue } from "@main/nvidiaDriver"

// Captured live from nvidia.com's lookupValueSearch.aspx during development.
const REAL_SERIES_UNDER_GEFORCE: LookupValue[] = [
  { name: "GeForce RTX 40 Series (Notebooks)", value: 129 },
  { name: "GeForce RTX 40 Series", value: 127 },
  { name: "GeForce RTX 30 Series (Notebooks)", value: 106 },
  { name: "GeForce RTX 30 Series", value: 95 },
]

const REAL_PRODUCTS_UNDER_RTX_40: LookupValue[] = [
  { name: "NVIDIA GeForce RTX 4090 D", value: 1036 },
  { name: "NVIDIA GeForce RTX 4090", value: 995 },
  { name: "NVIDIA GeForce RTX 4080 SUPER", value: 1041 },
  { name: "NVIDIA GeForce RTX 4080", value: 999 },
  { name: "NVIDIA GeForce RTX 4070 Ti SUPER", value: 1040 },
  { name: "NVIDIA GeForce RTX 4070 Ti", value: 1001 },
  { name: "NVIDIA GeForce RTX 4070 SUPER", value: 1039 },
  { name: "NVIDIA GeForce RTX 4070", value: 1015 },
  { name: "NVIDIA GeForce RTX 4060 Ti", value: 1022 },
  { name: "NVIDIA GeForce RTX 4060", value: 1023 },
]

describe("deriveSeriesToken", () => {
  it("extracts the series bucket from real systeminformation-style model strings", () => {
    expect(deriveSeriesToken("NVIDIA GeForce RTX 4070")).toBe("RTX 40")
    expect(deriveSeriesToken("NVIDIA GeForce RTX 4070 Ti SUPER")).toBe("RTX 40")
    expect(deriveSeriesToken("NVIDIA GeForce RTX 3090")).toBe("RTX 30")
    expect(deriveSeriesToken("NVIDIA GeForce GTX 1660 Ti")).toBe("GTX 16")
    expect(deriveSeriesToken("NVIDIA GeForce GTX 1060")).toBe("GTX 10")
  })

  it("returns null for GPUs with no recognizable series token", () => {
    expect(deriveSeriesToken("Intel(R) Graphics")).toBeNull()
    expect(deriveSeriesToken("AMD Radeon RX 7900 XTX")).toBeNull()
  })
})

describe("matchSeries", () => {
  it("picks the desktop variant for a desktop machine", () => {
    const result = matchSeries(REAL_SERIES_UNDER_GEFORCE, "RTX 40", false)
    expect(result).toEqual({ name: "GeForce RTX 40 Series", value: 127 })
  })

  it("picks the notebook variant for a laptop", () => {
    const result = matchSeries(REAL_SERIES_UNDER_GEFORCE, "RTX 40", true)
    expect(result).toEqual({ name: "GeForce RTX 40 Series (Notebooks)", value: 129 })
  })

  it("falls back to whichever variant exists if the preferred one is missing", () => {
    const onlyDesktop = REAL_SERIES_UNDER_GEFORCE.filter((s) => !/notebook/i.test(s.name))
    expect(matchSeries(onlyDesktop, "RTX 40", true)?.value).toBe(127)
  })

  it("returns null when the series token has no match at all", () => {
    expect(matchSeries(REAL_SERIES_UNDER_GEFORCE, "RTX 90", false)).toBeNull()
  })
})

describe("matchProduct", () => {
  it("matches the real RTX 4070 product against a plain model string", () => {
    const result = matchProduct(REAL_PRODUCTS_UNDER_RTX_40, "NVIDIA GeForce RTX 4070")
    expect(result).toEqual({ name: "NVIDIA GeForce RTX 4070", value: 1015 })
  })

  it("does not confuse RTX 4070 with RTX 4070 Ti or SUPER variants", () => {
    expect(matchProduct(REAL_PRODUCTS_UNDER_RTX_40, "NVIDIA GeForce RTX 4070")?.value).toBe(1015)
    expect(matchProduct(REAL_PRODUCTS_UNDER_RTX_40, "NVIDIA GeForce RTX 4070 Ti")?.value).toBe(1001)
    expect(matchProduct(REAL_PRODUCTS_UNDER_RTX_40, "NVIDIA GeForce RTX 4070 SUPER")?.value).toBe(1039)
  })

  it("matches even without the vendor prefix systeminformation sometimes omits", () => {
    expect(matchProduct(REAL_PRODUCTS_UNDER_RTX_40, "GeForce RTX 4090")?.value).toBe(995)
  })

  it("returns null for a model absent from the product list", () => {
    expect(matchProduct(REAL_PRODUCTS_UNDER_RTX_40, "NVIDIA GeForce RTX 4050")).toBeNull()
  })
})
