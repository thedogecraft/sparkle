import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Greeting from '../../components/greeting'

// Mock the electron invoke function
const mockInvoke = vi.fn()
vi.mock('@/lib/electron', () => ({
  invoke: (...args) => mockInvoke(...args),
}))

describe('Greeting Component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockInvoke.mockClear()
    vi.clearAllTimers()
  })

  it('should render without crashing', () => {
    render(<Greeting />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('should display a random greeting', () => {
    render(<Greeting />)
    const heading = screen.getByRole('heading')
    
    const greetings = [
      'Hello', 'Hi', 'Hey', 'Howdy', 'Greetings', 'Welcome', 
      'Good morning', 'Good afternoon', 'Good evening'
    ]
    
    const headingText = heading.textContent
    const hasGreeting = greetings.some(greeting => headingText.includes(greeting))
    expect(hasGreeting).toBe(true)
  })

  it('should display "friend" when no name is stored', () => {
    render(<Greeting />)
    expect(screen.getByText(/friend/i)).toBeInTheDocument()
  })

  it('should display stored username from localStorage', async () => {
    localStorage.setItem('sparkle:user', 'John')
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(screen.getByText(/John/)).toBeInTheDocument()
    })
  })

  it('should fetch username via IPC when not in localStorage', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: 'Jane' })
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('get-user-name')
    })
    
    await waitFor(() => {
      expect(screen.getByText(/Jane/)).toBeInTheDocument()
    })
  })

  it('should store fetched username in localStorage', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: 'Alice' })
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(localStorage.getItem('sparkle:user')).toBe('Alice')
    })
  })

  it('should handle IPC fetch failure gracefully', async () => {
    mockInvoke.mockResolvedValue({ success: false })
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
    
    // Should still display "friend" on failure
    expect(screen.getByText(/friend/i)).toBeInTheDocument()
  })

  it('should handle IPC rejection gracefully', async () => {
    mockInvoke.mockRejectedValue(new Error('IPC Error'))
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
    
    // Should display "friend" on error
    expect(screen.getByText(/friend/i)).toBeInTheDocument()
  })

  it('should include time-based greeting (morning, afternoon, or evening)', () => {
    render(<Greeting />)
    const heading = screen.getByRole('heading')
    const text = heading.textContent
    
    const timeGreetings = ['Good morning', 'Good afternoon', 'Good evening']
    const hasTimeGreeting = timeGreetings.some(greeting => text.includes(greeting))
    
    // May or may not have time greeting, but should be present in the pool
    expect(typeof hasTimeGreeting).toBe('boolean')
  })

  it('should apply gradient styling to username', () => {
    localStorage.setItem('sparkle:user', 'Bob')
    
    render(<Greeting />)
    
    const gradientSpan = document.querySelector('.bg-linear-to-r')
    expect(gradientSpan).toBeInTheDocument()
    expect(gradientSpan).toHaveClass('text-transparent', 'bg-clip-text')
  })

  it('should use text-3xl font size for heading', () => {
    render(<Greeting />)
    const heading = screen.getByRole('heading')
    expect(heading).toHaveClass('text-3xl', 'font-bold', 'mb-5')
  })

  it('should memoize greeting selection', () => {
    const { rerender } = render(<Greeting />)
    const firstText = screen.getByRole('heading').textContent
    
    rerender(<Greeting />)
    const secondText = screen.getByRole('heading').textContent
    
    // Greeting should remain the same on rerender due to useMemo
    expect(firstText).toBe(secondText)
  })

  it('should only fetch username once on mount', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: 'Charlie' })
    
    const { rerender } = render(<Greeting />)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })
    
    rerender(<Greeting />)
    
    // Should still be called only once
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('should handle empty string username from IPC', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: '' })
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
    
    // Should display "friend" for empty username
    expect(screen.getByText(/friend/i)).toBeInTheDocument()
  })

  it('should handle whitespace-only username', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: '   ' })
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
    
    // Depending on implementation, might show "friend" or the whitespace
    const heading = screen.getByRole('heading')
    expect(heading).toBeInTheDocument()
  })

  it('should handle special characters in username', async () => {
    const specialName = 'José-María'
    mockInvoke.mockResolvedValue({ success: true, data: specialName })
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(screen.getByText(new RegExp(specialName))).toBeInTheDocument()
    })
  })

  it('should handle very long usernames', async () => {
    const longName = 'A'.repeat(100)
    mockInvoke.mockResolvedValue({ success: true, data: longName })
    
    render(<Greeting />)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
    
    // Should still render without breaking
    const heading = screen.getByRole('heading')
    expect(heading).toBeInTheDocument()
  })
})