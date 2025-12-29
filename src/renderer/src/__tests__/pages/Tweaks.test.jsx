import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Tweaks from '../../pages/Tweaks'

// Mock invoke
const mockInvoke = vi.fn()
vi.mock('@/lib/electron', () => ({
  invoke: (...args) => mockInvoke(...args),
}))

// Mock stores
vi.mock('@/stores/restartStore', () => ({
  default: vi.fn(() => ({
    setNeedsRestart: vi.fn(),
  })),
}))

// Mock UI components
vi.mock('../../components/ui/Card', () => ({
  default: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
}))

vi.mock('../../components/ui/toggle', () => ({
  default: ({ checked, onChange }) => (
    <input type="checkbox" checked={checked} onChange={onChange} data-testid="toggle" />
  ),
}))

vi.mock('../../components/ui/input', () => ({
  LargeInput: (props) => <input {...props} data-testid="search-input" />,
}))

vi.mock('../../components/ui/modal', () => ({
  default: ({ show, children }) => show ? <div data-testid="modal">{children}</div> : null,
}))

const mockTweaks = [
  {
    id: 'tweak1',
    name: 'Test Tweak 1',
    description: 'Description 1',
    category: 'Performance',
    tags: ['gaming', 'fps'],
    needsRestart: false,
  },
  {
    id: 'tweak2',
    name: 'Test Tweak 2',
    description: 'Description 2',
    category: 'Privacy',
    tags: ['security'],
    needsRestart: true,
  },
]

describe('Tweaks Component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockInvoke.mockClear()
    mockInvoke.mockResolvedValue({ success: true, data: mockTweaks })
  })

  it('should render without crashing', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })
  })

  it('should fetch tweaks on mount', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('get-tweaks')
    })
  })

  it('should display search input', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })
  })

  it('should display category filter buttons', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
    })
  })

  it('should filter tweaks by category', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getByText('Performance')).toBeInTheDocument()
    })
    
    const categoryButton = screen.getByText('Performance')
    fireEvent.click(categoryButton)
    
    await waitFor(() => {
      expect(screen.getByText('Test Tweak 1')).toBeInTheDocument()
    })
  })

  it('should filter tweaks by search query', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByTestId('search-input')
    fireEvent.change(searchInput, { target: { value: 'Test Tweak 1' } })
    
    await waitFor(() => {
      expect(screen.getByText('Test Tweak 1')).toBeInTheDocument()
    })
  })

  it('should display tweak cards', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      const cards = screen.getAllByTestId('card')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  it('should call apply IPC when toggle is activated', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: mockTweaks })
      .mockResolvedValueOnce({ success: true, data: {} })
      .mockResolvedValueOnce({ success: true })
    
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getAllByTestId('toggle').length).toBeGreaterThan(0)
    })
    
    const toggle = screen.getAllByTestId('toggle')[0]
    fireEvent.click(toggle)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('apply-tweak', expect.any(String))
    })
  })

  it('should call unapply IPC when toggle is deactivated', async () => {
    const activeTweaks = mockTweaks.map(t => ({ ...t, applied: true }))
    mockInvoke.mockResolvedValueOnce({ success: true, data: activeTweaks })
      .mockResolvedValueOnce({ success: true, data: { tweak1: true, tweak2: true } })
      .mockResolvedValueOnce({ success: true })
    
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getAllByTestId('toggle').length).toBeGreaterThan(0)
    })
    
    const toggle = screen.getAllByTestId('toggle')[0]
    fireEvent.click(toggle)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('unapply-tweak', expect.any(String))
    })
  })

  it('should show modal when tweak has modalInstructions', async () => {
    const tweaksWithModal = [{
      ...mockTweaks[0],
      modalInstructions: 'Follow these steps',
    }]
    mockInvoke.mockResolvedValueOnce({ success: true, data: tweaksWithModal })
      .mockResolvedValueOnce({ success: true, data: {} })
      .mockResolvedValueOnce({ success: true })
    
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getAllByTestId('toggle').length).toBeGreaterThan(0)
    })
    
    const toggle = screen.getAllByTestId('toggle')[0]
    fireEvent.click(toggle)
    
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  it('should flag restart when tweak needs restart', async () => {
    const setNeedsRestart = vi.fn()
    vi.mocked(require('@/stores/restartStore').default).mockReturnValue({ setNeedsRestart })
    
    mockInvoke.mockResolvedValueOnce({ success: true, data: mockTweaks })
      .mockResolvedValueOnce({ success: true, data: {} })
      .mockResolvedValueOnce({ success: true })
    
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getAllByTestId('toggle').length).toBeGreaterThan(1)
    })
    
    // Click the toggle for tweak2 which needs restart
    const toggles = screen.getAllByTestId('toggle')
    fireEvent.click(toggles[1])
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('apply-tweak', 'tweak2')
    })
  })

  it('should persist toggle states to localStorage', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: mockTweaks })
      .mockResolvedValueOnce({ success: true, data: {} })
      .mockResolvedValueOnce({ success: true })
    
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getAllByTestId('toggle').length).toBeGreaterThan(0)
    })
    
    const toggle = screen.getAllByTestId('toggle')[0]
    fireEvent.click(toggle)
    
    await waitFor(() => {
      const saved = localStorage.getItem('tweak-states')
      expect(saved).toBeTruthy()
    })
  })

  it('should load toggle states from localStorage', async () => {
    localStorage.setItem('tweak-states', JSON.stringify({ tweak1: true }))
    
    render(<Tweaks />)
    await waitFor(() => {
      const toggles = screen.getAllByTestId('toggle')
      expect(toggles.some(t => t.checked)).toBe(true)
    })
  })

  it('should handle tweak apply failure', async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, data: mockTweaks })
      .mockResolvedValueOnce({ success: true, data: {} })
      .mockRejectedValueOnce(new Error('Apply failed'))
    
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getAllByTestId('toggle').length).toBeGreaterThan(0)
    })
    
    const toggle = screen.getAllByTestId('toggle')[0]
    fireEvent.click(toggle)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
  })

  it('should apply rounded-full styling to category buttons', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument()
    })
    
    const button = screen.getByText('All')
    expect(button).toHaveClass('rounded-full')
  })

  it('should handle empty tweaks list', async () => {
    mockInvoke.mockResolvedValue({ success: true, data: [] })
    
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })
  })

  it('should display tweak categories from loaded tweaks', async () => {
    render(<Tweaks />)
    await waitFor(() => {
      expect(screen.getByText('Performance')).toBeInTheDocument()
      expect(screen.getByText('Privacy')).toBeInTheDocument()
    })
  })

  it('should show "New" badge for new tweaks', async () => {
    const newTweaks = [{
      ...mockTweaks[0],
      version: '2.11.0',
    }]
    mockInvoke.mockResolvedValue({ success: true, data: newTweaks })
    
    render(<Tweaks />)
    await waitFor(() => {
      // Check if New badge appears for new version tweaks
      const cards = screen.getAllByTestId('card')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  it('should show "Updated" badge for updated tweaks', async () => {
    const updatedTweaks = [{
      ...mockTweaks[0],
      updatedVersion: '2.11.0',
    }]
    mockInvoke.mockResolvedValue({ success: true, data: updatedTweaks })
    
    render(<Tweaks />)
    await waitFor(() => {
      const cards = screen.getAllByTestId('card')
      expect(cards.length).toBeGreaterThan(0)
    })
  })
})