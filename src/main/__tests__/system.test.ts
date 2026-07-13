import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("electron-log", () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
  log: vi.fn(), error: vi.fn(), warn: vi.fn(),
}))

vi.mock("electron", () => ({
  app: { getPath: vi.fn(() => ""), getAppPath: vi.fn(() => "") },
  shell: { openPath: vi.fn(), openExternal: vi.fn() },
  ipcMain: { handle: vi.fn(), removeHandler: vi.fn() },
}))

const mockRequest = vi.fn()
vi.mock("@main/sidecar", () => ({
  getSidecar: () => ({ request: mockRequest }),
}))

const { checkWinget } = await import("@main/system")

beforeEach(() => {
  vi.clearAllMocks()
  mockRequest.mockReset()
})

describe("checkWinget", () => {
  it("returns installed=true when winget command succeeds", async () => {
    mockRequest.mockResolvedValue({ success: true, installed: true })

    const result = await checkWinget()

    expect(result).toEqual({ success: true, installed: true })
    expect(mockRequest).toHaveBeenCalledWith("system.checkWinget")
  })

  it("returns installed=false when winget command fails", async () => {
    mockRequest.mockResolvedValue({ success: true, installed: false })

    const result = await checkWinget()

    expect(result).toEqual({ success: true, installed: false })
  })

  it("calls sidecar with correct method", async () => {
    mockRequest.mockResolvedValue({ success: true, installed: true })

    await checkWinget()

    expect(mockRequest).toHaveBeenCalledWith("system.checkWinget")
  })
})
