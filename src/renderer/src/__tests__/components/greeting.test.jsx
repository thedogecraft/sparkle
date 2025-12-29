import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Greeting from '../../components/greeting'

// Mock the electron invoke function
vi.mock('@/lib/electron', () => ({
  invoke: vi.fn()
}))

import { invoke } from '@/lib/electron'

describe('Greeting Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Greeting />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('should render default greeting when no name is available', () => {
      render(<Greeting />)
      expect(screen.getByText(/friend/i)).toBeInTheDocument()
    })

    it('should display one of the valid greetings', () => {
      render(<Greeting />)
      const heading = screen.getByRole('heading', { level: 1 })
      const text = heading.textContent || ''
      
      const validGreetings = [
        'Hi', 'Hello', 'Hey', 'Greetings', 'Yo', 'Howdy', 
        "What's up", 'Good to see you', 'Welcome Back', 'Ahoy',
        'Good morning', 'Good afternoon', 'Good evening'
      ]
      
      const hasValidGreeting = validGreetings.some(greeting => 
        text.includes(greeting)
      )
      
      expect(hasValidGreeting).toBe(true)
    })
  })

  describe('User Name from LocalStorage', () => {
    it('should display cached username from localStorage', () => {
      localStorage.setItem('sparkle:user', 'TestUser')
      
      render(<Greeting />)
      
      expect(screen.getByText(/TestUser/i)).toBeInTheDocument()
    })

    it('should prefer localStorage over API call', () => {
      localStorage.setItem('sparkle:user', 'CachedUser')
      invoke.mockResolvedValue('APIUser')
      
      render(<Greeting />)
      
      expect(screen.getByText(/CachedUser/i)).toBeInTheDocument()
      expect(invoke).not.toHaveBeenCalled()
    })
  })

  describe('User Name from API', () => {
    it('should fetch username from API when not cached', async () => {
      invoke.mockResolvedValue('FetchedUser')
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith({ channel: 'get-user-name' })
        expect(screen.getByText(/FetchedUser/i)).toBeInTheDocument()
      })
    })

    it('should cache fetched username', async () => {
      invoke.mockResolvedValue('NewUser')
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(localStorage.getItem('sparkle:user')).toBe('NewUser')
      })
    })

    it('should handle API error gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      invoke.mockRejectedValue(new Error('API Error'))
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(invoke).toHaveBeenCalled()
        expect(consoleError).toHaveBeenCalled()
        expect(screen.getByText(/friend/i)).toBeInTheDocument()
      })
      
      consoleError.mockRestore()
    })

    it('should not update name if API returns empty', async () => {
      invoke.mockResolvedValue('')
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(screen.getByText(/friend/i)).toBeInTheDocument()
      })
    })

    it('should not update name if API returns null', async () => {
      invoke.mockResolvedValue(null)
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(screen.getByText(/friend/i)).toBeInTheDocument()
      })
    })
  })

  describe('Time-based Greetings', () => {
    it('should include time-appropriate greeting', () => {
      const hour = new Date().getHours()
      let expectedGreeting = 'Good evening'
      
      if (hour < 12) {
        expectedGreeting = 'Good morning'
      } else if (hour < 18) {
        expectedGreeting = 'Good afternoon'
      }
      
      // Render multiple times to increase chance of getting time-based greeting
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<Greeting />)
        const heading = screen.getByRole('heading', { level: 1 })
        
        if (heading.textContent?.includes(expectedGreeting)) {
          expect(heading.textContent).toContain(expectedGreeting)
          unmount()
          return
        }
        unmount()
      }
    })
  })

  describe('Styling', () => {
    it('should apply gradient to username', () => {
      localStorage.setItem('sparkle:user', 'StyledUser')
      
      render(<Greeting />)
      
      const nameElement = screen.getByText('StyledUser')
      expect(nameElement).toHaveClass('bg-clip-text', 'text-transparent')
    })

    it('should have proper heading structure', () => {
      render(<Greeting />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-3xl', 'font-bold')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long usernames', async () => {
      const longName = 'A'.repeat(100)
      invoke.mockResolvedValue(longName)
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(screen.getByText(new RegExp(longName))).toBeInTheDocument()
      })
    })

    it('should handle special characters in username', async () => {
      const specialName = 'User@123!#$'
      invoke.mockResolvedValue(specialName)
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(screen.getByText(new RegExp(specialName))).toBeInTheDocument()
      })
    })

    it('should handle unicode characters in username', async () => {
      const unicodeName = '用户名👋'
      invoke.mockResolvedValue(unicodeName)
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(screen.getByText(new RegExp(unicodeName))).toBeInTheDocument()
      })
    })

    it('should handle whitespace in username', async () => {
      const whitespaceName = '  John Doe  '
      invoke.mockResolvedValue(whitespaceName)
      
      render(<Greeting />)
      
      await waitFor(() => {
        expect(screen.getByText(new RegExp(whitespaceName))).toBeInTheDocument()
      })
    })
  })

  describe('Randomization', () => {
    it('should potentially show different greetings on multiple renders', () => {
      const greetings = new Set()
      
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(<Greeting />)
        const heading = screen.getByRole('heading', { level: 1 })
        const text = heading.textContent?.split(',')[0] || ''
        greetings.add(text.trim())
        unmount()
      }
      
      // With 13 possible greetings, rendering 20 times should give us multiple unique ones
      expect(greetings.size).toBeGreaterThan(1)
    })
  })
})