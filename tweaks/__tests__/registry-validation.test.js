import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Registry JSON Validation', () => {
  let registryJson
  let registryScriptsJson

  beforeAll(() => {
    const registryPath = join(__dirname, '..', 'registry.json')
    const scriptsPath = join(__dirname, '..', 'registry-scripts.json')
    
    registryJson = JSON.parse(readFileSync(registryPath, 'utf-8'))
    registryScriptsJson = JSON.parse(readFileSync(scriptsPath, 'utf-8'))
  })

  describe('registry.json', () => {
    describe('Schema Structure', () => {
      it('should be valid JSON', () => {
        expect(registryJson).toBeDefined()
        expect(typeof registryJson).toBe('object')
      })

      it('should have version field', () => {
        expect(registryJson).toHaveProperty('version')
        expect(typeof registryJson.version).toBe('string')
      })

      it('should have tweaks array', () => {
        expect(registryJson).toHaveProperty('tweaks')
        expect(Array.isArray(registryJson.tweaks)).toBe(true)
      })

      it('should have valid ISO 8601 timestamp in version', () => {
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        expect(registryJson.version).toMatch(isoRegex)
      })

      it('should have parseable date in version field', () => {
        const date = new Date(registryJson.version)
        expect(date).toBeInstanceOf(Date)
        expect(date.toString()).not.toBe('Invalid Date')
      })
    })

    describe('Tweaks Array', () => {
      it('should contain at least one tweak', () => {
        expect(registryJson.tweaks.length).toBeGreaterThan(0)
      })

      it('should have unique tweak IDs', () => {
        const ids = registryJson.tweaks.map(t => t.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
      })

      it('should have valid structure for each tweak', () => {
        registryJson.tweaks.forEach((tweak, index) => {
          expect(tweak, `Tweak at index ${index} should have id`).toHaveProperty('id')
          expect(typeof tweak.id, `Tweak ${tweak.id} id should be string`).toBe('string')
        })
      })

      it('should not have empty IDs', () => {
        registryJson.tweaks.forEach(tweak => {
          expect(tweak.id.length).toBeGreaterThan(0)
        })
      })

      it('should have consistent ID format (kebab-case)', () => {
        const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
        registryJson.tweaks.forEach(tweak => {
          expect(tweak.id, `ID ${tweak.id} should be kebab-case`).toMatch(kebabCaseRegex)
        })
      })
    })

    describe('Version Updates', () => {
      it('should have version matching current timestamp format', () => {
        // Version should be recent (within last year for testing purposes)
        const versionDate = new Date(registryJson.version)
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        
        expect(versionDate.getTime()).toBeGreaterThan(oneYearAgo.getTime())
      })

      it('should have version in 2025', () => {
        const versionDate = new Date(registryJson.version)
        expect(versionDate.getFullYear()).toBe(2025)
      })
    })
  })

  describe('registry-scripts.json', () => {
    describe('Schema Structure', () => {
      it('should be valid JSON', () => {
        expect(registryScriptsJson).toBeDefined()
        expect(typeof registryScriptsJson).toBe('object')
      })

      it('should have version field', () => {
        expect(registryScriptsJson).toHaveProperty('version')
        expect(typeof registryScriptsJson.version).toBe('string')
      })

      it('should have tweaks array', () => {
        expect(registryScriptsJson).toHaveProperty('tweaks')
        expect(Array.isArray(registryScriptsJson.tweaks)).toBe(true)
      })

      it('should have valid ISO 8601 timestamp in version', () => {
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        expect(registryScriptsJson.version).toMatch(isoRegex)
      })
    })

    describe('Tweaks Array', () => {
      it('should contain at least one tweak', () => {
        expect(registryScriptsJson.tweaks.length).toBeGreaterThan(0)
      })

      it('should have unique tweak IDs', () => {
        const ids = registryScriptsJson.tweaks.map(t => t.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
      })

      it('should have scripts object for each tweak', () => {
        registryScriptsJson.tweaks.forEach((tweak, index) => {
          expect(tweak, `Tweak at index ${index}`).toHaveProperty('scripts')
          expect(typeof tweak.scripts, `Scripts for ${tweak.id}`).toBe('object')
        })
      })

      it('should have apply script for tweaks with scripts', () => {
        const tweaksWithScripts = registryScriptsJson.tweaks.filter(t => t.scripts)
        tweaksWithScripts.forEach(tweak => {
          if (Object.keys(tweak.scripts).length > 0) {
            expect(tweak.scripts).toHaveProperty('apply')
          }
        })
      })

      it('should have non-empty apply scripts where present', () => {
        registryScriptsJson.tweaks.forEach(tweak => {
          if (tweak.scripts && tweak.scripts.apply) {
            expect(tweak.scripts.apply.length).toBeGreaterThan(0)
          }
        })
      })

      it('should have consistent ID format', () => {
        const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
        registryScriptsJson.tweaks.forEach(tweak => {
          expect(tweak.id).toMatch(kebabCaseRegex)
        })
      })
    })

    describe('Script Content', () => {
      it('should have PowerShell scripts for Windows tweaks', () => {
        registryScriptsJson.tweaks.forEach(tweak => {
          if (tweak.scripts && tweak.scripts.apply) {
            // Check if script contains PowerShell indicators
            const script = tweak.scripts.apply
            const hasPowerShellSyntax = 
              script.includes('param(') ||
              script.includes('$') ||
              script.includes('function ') ||
              script.includes('Write-Host')
            
            if (hasPowerShellSyntax) {
              expect(script.length).toBeGreaterThan(10)
            }
          }
        })
      })

      it('should not have syntax errors in common patterns', () => {
        registryScriptsJson.tweaks.forEach(tweak => {
          if (tweak.scripts && tweak.scripts.apply) {
            const script = tweak.scripts.apply
            
            // Check for common issues
            expect(script).not.toContain('undefined')
            expect(script).not.toContain('null')
            
            // Check balanced brackets if script contains them
            const openBraces = (script.match(/{/g) || []).length
            const closeBraces = (script.match(/}/g) || []).length
            const openParens = (script.match(/\(/g) || []).length
            const closeParens = (script.match(/\)/g) || []).length
            
            if (openBraces > 0 || closeBraces > 0) {
              expect(openBraces).toBe(closeBraces)
            }
            if (openParens > 0 || closeParens > 0) {
              expect(openParens).toBe(closeParens)
            }
          }
        })
      })
    })

    describe('Debloat Script Specific', () => {
      it('should have debloat-windows tweak with apply script', () => {
        const debloatTweak = registryScriptsJson.tweaks.find(t => t.id === 'debloat-windows')
        expect(debloatTweak).toBeDefined()
        expect(debloatTweak?.scripts).toHaveProperty('apply')
      })

      it('should have comprehensive debloat script', () => {
        const debloatTweak = registryScriptsJson.tweaks.find(t => t.id === 'debloat-windows')
        if (debloatTweak && debloatTweak.scripts.apply) {
          const script = debloatTweak.scripts.apply
          
          // Check for key components
          expect(script).toContain('param(')
          expect(script).toContain('appDefinitions')
          expect(script).toContain('Show-ScriptSelectionDialog')
          expect(script).toContain('Show-AppSelectionDialog')
          expect(script).toContain('Remove-SelectedApps')
        }
      })

      it('should have default apps list in debloat script', () => {
        const debloatTweak = registryScriptsJson.tweaks.find(t => t.id === 'debloat-windows')
        if (debloatTweak && debloatTweak.scripts.apply) {
          const script = debloatTweak.scripts.apply
          expect(script).toContain('$defaultApps')
          expect(script).toContain('Microsoft.WindowsCalculator')
        }
      })
    })
  })

  describe('Cross-file Consistency', () => {
    it('should have matching version timestamps', () => {
      expect(registryJson.version).toBe(registryScriptsJson.version)
    })

    it('should have same number of tweaks', () => {
      expect(registryJson.tweaks.length).toBe(registryScriptsJson.tweaks.length)
    })

    it('should have matching tweak IDs between files', () => {
      const registryIds = new Set(registryJson.tweaks.map(t => t.id))
      const scriptsIds = new Set(registryScriptsJson.tweaks.map(t => t.id))
      
      expect(registryIds.size).toBe(scriptsIds.size)
      
      registryIds.forEach(id => {
        expect(scriptsIds.has(id), `Script file missing ID: ${id}`).toBe(true)
      })
      
      scriptsIds.forEach(id => {
        expect(registryIds.has(id), `Registry file missing ID: ${id}`).toBe(true)
      })
    })

    it('should have tweaks in same order', () => {
      const registryIds = registryJson.tweaks.map(t => t.id)
      const scriptsIds = registryScriptsJson.tweaks.map(t => t.id)
      
      expect(registryIds).toEqual(scriptsIds)
    })
  })

  describe('Data Integrity', () => {
    it('should not have duplicate entries in registry.json', () => {
      const ids = registryJson.tweaks.map(t => t.id)
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
      expect(duplicates).toEqual([])
    })

    it('should not have duplicate entries in registry-scripts.json', () => {
      const ids = registryScriptsJson.tweaks.map(t => t.id)
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
      expect(duplicates).toEqual([])
    })

    it('should have valid metadata structure', () => {
      registryJson.tweaks.forEach(tweak => {
        expect(tweak).toHaveProperty('id')
        expect(typeof tweak.id).toBe('string')
      })
    })

    it('should not have null or undefined values in required fields', () => {
      registryJson.tweaks.forEach(tweak => {
        expect(tweak.id).not.toBeNull()
        expect(tweak.id).not.toBeUndefined()
      })
      
      registryScriptsJson.tweaks.forEach(tweak => {
        expect(tweak.id).not.toBeNull()
        expect(tweak.id).not.toBeUndefined()
        expect(tweak.scripts).not.toBeNull()
        expect(tweak.scripts).not.toBeUndefined()
      })
    })
  })

  describe('Version Timestamp Validation', () => {
    it('should have matching timestamps to 2025-12-24 range', () => {
      const versionDate = new Date(registryJson.version)
      expect(versionDate.getFullYear()).toBe(2025)
      expect(versionDate.getMonth()).toBe(11) // December (0-indexed)
      expect(versionDate.getDate()).toBe(24)
    })

    it('should have valid hour/minute/second in timestamp', () => {
      const versionDate = new Date(registryJson.version)
      expect(versionDate.getHours()).toBeGreaterThanOrEqual(0)
      expect(versionDate.getHours()).toBeLessThan(24)
      expect(versionDate.getMinutes()).toBeGreaterThanOrEqual(0)
      expect(versionDate.getMinutes()).toBeLessThan(60)
    })
  })
})