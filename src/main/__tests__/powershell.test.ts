import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("electron-log", () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
  log: vi.fn(), error: vi.fn(), warn: vi.fn(),
}))

vi.mock("electron", () => ({
  app: { getPath: vi.fn(), isPackaged: false },
  ipcMain: { handle: vi.fn(), removeHandler: vi.fn() },
}))

const mockRequest = vi.fn()
vi.mock("@main/sidecar", () => ({
  getSidecar: () => ({ request: mockRequest }),
}))

const { checkChocolatey } = await import("@main/powershell")

beforeEach(() => {
  vi.restoreAllMocks()
  mockRequest.mockReset()
})

describe("checkChocolatey", () => {
  it("returns installed=true when choco.exe exists", async () => {
    mockRequest.mockResolvedValue({ success: true, installed: true })

    const result = await checkChocolatey()

    expect(result).toEqual({ success: true, installed: true })
    expect(mockRequest).toHaveBeenCalledWith("choco.check")
  })

  it("returns installed=false when choco.exe does not exist", async () => {
    mockRequest.mockResolvedValue({ success: true, installed: false })

    const result = await checkChocolatey()

    expect(result).toEqual({ success: true, installed: false })
  })

  it("handles errors gracefully", async () => {
    mockRequest.mockRejectedValue(new Error("access denied"))

    await expect(checkChocolatey()).rejects.toThrow("access denied")
  })
})
