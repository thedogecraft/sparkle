import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useSidebarStore from '../../store/sidebarStore'

describe('useSidebarStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset store to initial state
    useSidebarStore.setState({ isCollapsed: false })
  })

  describe('Initial State', () => {
    it('should have isCollapsed set to false by default', () => {
      const { result } = renderHook(() => useSidebarStore())
      expect(result.current.isCollapsed).toBe(false)
    })

    it('should provide toggle function', () => {
      const { result } = renderHook(() => useSidebarStore())
      expect(typeof result.current.toggle).toBe('function')
    })

    it('should provide setCollapsed function', () => {
      const { result } = renderHook(() => useSidebarStore())
      expect(typeof result.current.setCollapsed).toBe('function')
    })
  })

  describe('toggle function', () => {
    it('should toggle isCollapsed from false to true', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.toggle()
      })
      
      expect(result.current.isCollapsed).toBe(true)
    })

    it('should toggle isCollapsed from true to false', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(true)
      })
      
      expect(result.current.isCollapsed).toBe(true)
      
      act(() => {
        result.current.toggle()
      })
      
      expect(result.current.isCollapsed).toBe(false)
    })

    it('should toggle multiple times correctly', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      // Toggle 5 times
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.toggle()
        })
        expect(result.current.isCollapsed).toBe(i % 2 === 0)
      }
    })
  })

  describe('setCollapsed function', () => {
    it('should set isCollapsed to true', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(true)
      })
      
      expect(result.current.isCollapsed).toBe(true)
    })

    it('should set isCollapsed to false', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(true)
        result.current.setCollapsed(false)
      })
      
      expect(result.current.isCollapsed).toBe(false)
    })

    it('should accept boolean true', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(true)
      })
      
      expect(result.current.isCollapsed).toBe(true)
    })

    it('should accept boolean false', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(false)
      })
      
      expect(result.current.isCollapsed).toBe(false)
    })

    it('should not change state when setting to same value', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(false)
      })
      
      expect(result.current.isCollapsed).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should persist state to localStorage with correct key', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(true)
      })
      
      // Check if localStorage.setItem was called
      expect(localStorage.setItem).toHaveBeenCalled()
      
      // Verify the stored data contains our state
      const calls = localStorage.setItem.mock.calls
      const sidebarCall = calls.find(call => call[0] === 'sidebar-storage')
      expect(sidebarCall).toBeDefined()
      
      if (sidebarCall) {
        const storedData = JSON.parse(sidebarCall[1])
        expect(storedData.state.isCollapsed).toBe(true)
      }
    })

    it('should restore state from localStorage on initialization', () => {
      // Set up localStorage with persisted state
      const persistedState = {
        state: { isCollapsed: true },
        version: 0
      }
      localStorage.getItem.mockReturnValue(JSON.stringify(persistedState))
      
      // Create new hook instance
      const { result } = renderHook(() => useSidebarStore())
      
      // Should restore the persisted state
      expect(result.current.isCollapsed).toBe(true)
    })

    it('should handle missing localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarStore())
      
      // Should use default state
      expect(result.current.isCollapsed).toBe(false)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid json')
      
      const { result } = renderHook(() => useSidebarStore())
      
      // Should use default state
      expect(result.current.isCollapsed).toBe(false)
    })
  })

  describe('State Synchronization', () => {
    it('should synchronize state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useSidebarStore())
      const { result: result2 } = renderHook(() => useSidebarStore())
      
      expect(result1.current.isCollapsed).toBe(result2.current.isCollapsed)
      
      act(() => {
        result1.current.toggle()
      })
      
      expect(result1.current.isCollapsed).toBe(true)
      expect(result2.current.isCollapsed).toBe(true)
    })

    it('should update all subscribed components when state changes', () => {
      const { result: result1 } = renderHook(() => useSidebarStore())
      const { result: result2 } = renderHook(() => useSidebarStore())
      const { result: result3 } = renderHook(() => useSidebarStore())
      
      act(() => {
        result1.current.setCollapsed(true)
      })
      
      expect(result1.current.isCollapsed).toBe(true)
      expect(result2.current.isCollapsed).toBe(true)
      expect(result3.current.isCollapsed).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid toggle calls', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.toggle()
        }
      })
      
      // After 100 toggles (even number), should be back to false
      expect(result.current.isCollapsed).toBe(false)
    })

    it('should handle alternating setCollapsed calls', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(true)
        result.current.setCollapsed(false)
        result.current.setCollapsed(true)
        result.current.setCollapsed(false)
      })
      
      expect(result.current.isCollapsed).toBe(false)
    })

    it('should maintain type safety for isCollapsed', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.setCollapsed(true)
      })
      
      expect(typeof result.current.isCollapsed).toBe('boolean')
    })
  })

  describe('Store Name Configuration', () => {
    it('should use correct storage name for persistence', () => {
      const { result } = renderHook(() => useSidebarStore())
      
      act(() => {
        result.current.toggle()
      })
      
      // Verify the storage key is 'sidebar-storage'
      const setItemCalls = localStorage.setItem.mock.calls
      const hasSidebarStorage = setItemCalls.some(call => call[0] === 'sidebar-storage')
      expect(hasSidebarStorage).toBe(true)
    })
  })
})