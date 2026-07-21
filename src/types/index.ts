import React from "react"

export interface SystemInfo {
  platform?: string
  arch?: string
  version?: string
  hostname?: string
  userInfo?: {
    username: string
    homedir: string
  }
  cpu_model?: string
  cpu_cores?: number
  cpu_threads?: number
  gpu_model?: string
  vram?: string
  hasGPU?: boolean
  isNvidia?: boolean
  integrated_gpu?: string
  hasIntegratedGPU?: boolean
  memory_total?: number
  memory_type?: string
  os?: string
  os_version?: string
  disk_model?: string
  disk_size?: string
}

export interface Tweak {
  id: string
  name: string
  title?: string
  description: string
  deepDescription?: string
  modalDescription?: string
  modal?: boolean
  category: string | string[]
  applyScript: string
  unapplyScript?: string
  restart?: boolean
  top?: boolean
  reversible?: boolean
  warning?: string
  recommended?: boolean
  addedversion?: string
  updatedversion?: string
  risk?: "safe" | "risky" | "caution"
  meta: TweakMeta
}

export interface TweakMeta {
  name: string
  title?: string
  description: string
  deepDescription?: string
  category: string
  author?: string
  version?: string
  recommended?: boolean
  warning?: string
}

export interface AppUpdate {
  id: string
  name: string
  currentVersion: string
  availableVersion: string
  source: string
  /** Id column was cut off by winget's console truncation (ends in …);
   *  upgrades must fall back to substring matching instead of --exact. */
  truncated?: boolean
}

export interface WindowsUpdateItem {
  updateId: string
  title: string
  kb: string
  type: "Driver" | "Software"
  sizeBytes: number
  driverProvider?: string
  driverClass?: string
  driverVerDate?: string
}

export interface NvidiaDriverInfo {
  supported: boolean
  reason?: string
  installedVersion?: string
  latestVersion?: string
  releaseDate?: string
  downloadUrl?: string
  downloadSizeText?: string
}

export interface InstalledDriverDevice {
  deviceName: string
  driverVersion: string
  driverDate: string
  deviceClass: string
  updateId?: string
}

export interface DriverVendorGroup {
  vendor: string
  devices: InstalledDriverDevice[]
}

export interface GpuDriverStatus {
  hasGPU: boolean
  vendor: "nvidia" | "amd" | "intel" | "other" | null
  model: string
  installedVersion: string
  nvidia?: NvidiaDriverInfo
  vendorAppInstalled?: boolean
  vendorAppInstallable?: boolean
  vendorAppId?: string
  vendorAppName?: string
  manualUrl?: string
}

export interface AppInfo {
  id: string
  name: string
  version: string
  description?: string
  icon?: string
  installed: boolean
}

export interface BackupItem {
  id: string
  name: string
  path: string
  size: number
  createdAt: Date
}

export interface DNSConfig {
  primary: string
  secondary: string
  name: string
}

export interface ElectronAPI {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  getSystemInfo: () => Promise<SystemInfo>
  applyTweak: (tweakId: string) => Promise<boolean>
  unapplyTweak: (tweakId: string) => Promise<boolean>
  getTweaks: () => Promise<Tweak[]>
  backupSystem: () => Promise<boolean>
  restoreBackup: (backupId: string) => Promise<boolean>
  setDNS: (config: DNSConfig) => Promise<boolean>
  getApps: () => Promise<AppInfo[]>
}

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface NavItem {
  id: string
  label: string
  icon: React.ComponentType
  path: string
}
