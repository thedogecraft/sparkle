import React from "react"

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
