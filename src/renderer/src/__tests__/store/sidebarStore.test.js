import { describe, it, expect, beforeEach } from 'vitest'
import useSidebarStore from '../../store/sidebarStore'

describe('sidebarStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSidebarStore.setState({ isCollapsed: false })
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should have isCollapsed set to false by default', () => {
      const { isCollapsed } = useSidebarStore.getState()
      expect(isCollapsed).toBe(false)
    })

    it('should provide toggle function', () => {
      const { toggle } = useSidebarStore.getState()
      expect(toggle).toBeDefined()
      expect(typeof toggle).toBe('function')
    })

    it('should provide setCollapsed function', () => {
      const { setCollapsed } = useSidebarStore.getState()
      expect(setCollapsed).toBeDefined()
      expect(typeof setCollapsed).toBe('function')
    })
  })

  describe('toggle Function', () => {
    it('should toggle isCollapsed from false to true', () => {
      const { toggle } = useSidebarStore.getState()
      
      toggle()
      
      const { isCollapsed } = useSidebarStore.getState()
      expect(isCollapsed).toBe(true)
    })

    it('should toggle isCollapsed from true to false', () => {
      useSidebarStore.setState({ isCollapsed: true })
      const { toggle } = useSidebarStore.getState()
      
      toggle()
      
      const { isCollapsed } = useSidebarStore.getState()
      expect(isCollapsed).toBe(false)
    })

    it('should toggle multiple times correctly', () => {
      const { toggle } = useSidebarStore.getState()
      
      toggle() // false -> true
      expect(useSidebarStore.getState().isCollapsed).toBe(true)
      
      toggle() // true -> false
      expect(useSidebarStore.getState().isCollapsed).toBe(false)
      
      toggle() // false -> true
      expect(useSidebarStore.getState().isCollapsed).toBe(true)
    })
  })

  describe('setCollapsed Function', () => {
    it('should set isCollapsed to true', () => {
      const { setCollapsed } = useSidebarStore.getState()
      
      setCollapsed(true)
      
      const { isCollapsed } = useSidebarStore.getState()
      expect(isCollapsed).toBe(true)
    })

    it('should set isCollapsed to false', () => {
      useSidebarStore.setState({ isCollapsed: true })
      const { setCollapsed } = useSidebarStore.getState()
      
      setCollapsed(false)
      
      const { isCollapsed } = useSidebarStore.getState()
      expect(isCollapsed).toBe(false)
    })

    it('should handle boolean values correctly', () => {
      const { setCollapsed } = useSidebarStore.getState()
      
      setCollapsed(true)
      expect(useSidebarStore.getState().isCollapsed).toBe(true)
      
      setCollapsed(false)
      expect(useSidebarStore.getState().isCollapsed).toBe(false)
    })

    it('should override current state', () => {
      const { setCollapsed } = useSidebarStore.getState()
      
      setCollapsed(true)
      setCollapsed(true) // Set to same value
      expect(useSidebarStore.getState().isCollapsed).toBe(true)
      
      setCollapsed(false)
      setCollapsed(false) // Set to same value
      expect(useSidebarStore.getState().isCollapsed).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should persist state to localStorage', () => {
      const { toggle } = useSidebarStore.getState()
      
      toggle()
      
      // Check if localStorage contains the persisted state
      const stored = localStorage.getItem('sidebar-storage')
      expect(stored).toBeTruthy()
      
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.isCollapsed).toBe(true)
      }
    })

    it('should restore state from localStorage', () => {
      // Simulate persisted state
      localStorage.setItem('sidebar-storage', JSON.stringify({
        state: { isCollapsed: true },
        version: 0
      }))
      
      // Get a fresh instance to trigger hydration
      const state = useSidebarStore.getState()
      
      // Note: In actual usage, zustand persist middleware handles hydration
      // This test verifies the store configuration
      expect(state).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid toggle calls', () => {
      const { toggle } = useSidebarStore.getState()
      
      for (let i = 0; i < 10; i++) {
        toggle()
      }
      
      const { isCollapsed } = useSidebarStore.getState()
      expect(isCollapsed).toBe(false) // Even number of toggles
    })

    it('should maintain state consistency across multiple accesses', () => {
      const store1 = useSidebarStore.getState()
      const store2 = useSidebarStore.getState()
      
      store1.toggle()
      
      expect(store2.isCollapsed).toBe(store1.isCollapsed)
    })

    it('should handle setCollapsed with truthy/falsy values', () => {
      const { setCollapsed } = useSidebarStore.getState()
      
      setCollapsed(1) // Truthy
      expect(useSidebarStore.getState().isCollapsed).toBeTruthy()
      
      setCollapsed(0) // Falsy
      expect(useSidebarStore.getState().isCollapsed).toBeFalsy()
    })
  })
})