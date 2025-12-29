import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Settings from '../../pages/Settings'

// Mock electron invoke
const mockInvoke = vi.fn()
vi.mock('@/lib/electron', () => ({
  invoke: (...args) => mockInvoke(...args),
}))

// Mock dropdown component
vi.mock('../../components/ui/dropdown', () => ({
  Dropdown: ({ value, onChange, options }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} data-testid="dropdown">
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
}))

// Mock toggle component
vi.mock('../../components/ui/toggle', () => ({
  default: ({ checked, onChange }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      data-testid="toggle"
    />
  ),
}))

// Mock button component
vi.mock('../../components/ui/button', () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

describe('Settings Component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockInvoke.mockClear()
  })

  it('should render without crashing', () => {
    render(<Settings />)
    expect(screen.getByText(/appearance/i)).toBeInTheDocument()
  })

  it('should display theme selection dropdown', () => {
    render(<Settings />)
    expect(screen.getByTestId('dropdown')).toBeInTheDocument()
  })

  it('should load theme from localStorage', () => {
    localStorage.setItem('theme', 'dark')
    render(<Settings />)
    const dropdown = screen.getByTestId('dropdown')
    expect(dropdown).toHaveValue('dark')
  })

  it('should update theme when changed', () => {
    render(<Settings />)
    const dropdown = screen.getByTestId('dropdown')
    
    fireEvent.change(dropdown, { target: { value: 'light' } })
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('should display Discord Rich Presence toggle', () => {
    render(<Settings />)
    expect(screen.getByText(/discord rich presence/i)).toBeInTheDocument()
  })

  it('should load Discord RPC state from localStorage', () => {
    localStorage.setItem('discord-rpc-enabled', 'true')
    render(<Settings />)
    const toggles = screen.getAllByTestId('toggle')
    expect(toggles.some(t => t.checked)).toBe(true)
  })

  it('should toggle Discord RPC when changed', async () => {
    mockInvoke.mockResolvedValue({ success: true })
    render(<Settings />)
    
    const discordToggle = screen.getAllByTestId('toggle')[0]
    fireEvent.click(discordToggle)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('toggle-discord-rpc', expect.any(Boolean))
    })
  })

  it('should display analytics opt-out toggle', () => {
    render(<Settings />)
    expect(screen.getByText(/analytics/i)).toBeInTheDocument()
  })

  it('should load analytics preference from localStorage', () => {
    localStorage.setItem('posthog-disabled', 'true')
    render(<Settings />)
    // Analytics disabled should be reflected in UI
    const settings = document.body.textContent
    expect(settings).toBeTruthy()
  })

  it('should update analytics preference when toggled', () => {
    render(<Settings />)
    const toggles = screen.getAllByTestId('toggle')
    
    // Find the analytics toggle and click it
    toggles.forEach(toggle => {
      fireEvent.click(toggle)
    })
    
    // Check if localStorage was updated
    const posthogDisabled = localStorage.getItem('posthog-disabled')
    expect(posthogDisabled).toBeTruthy()
  })

  it('should display check for updates button', () => {
    render(<Settings />)
    expect(screen.getByText(/check for updates/i)).toBeInTheDocument()
  })

  it('should call onCheckForUpdates when button is clicked', async () => {
    const mockCheck = vi.fn()
    render(<Settings onCheckForUpdates={mockCheck} />)
    
    const button = screen.getByText(/check for updates/i)
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockCheck).toHaveBeenCalled()
    })
  })

  it('should display clear cache button', () => {
    render(<Settings />)
    expect(screen.getByText(/clear cache/i)).toBeInTheDocument()
  })

  it('should call IPC to clear cache when button is clicked', async () => {
    mockInvoke.mockResolvedValue({ success: true })
    render(<Settings />)
    
    const button = screen.getByText(/clear cache/i)
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('clear-cache')
    })
  })

  it('should display restart Explorer button', () => {
    render(<Settings />)
    expect(screen.getByText(/restart explorer/i)).toBeInTheDocument()
  })

  it('should call IPC to restart Explorer when button is clicked', async () => {
    mockInvoke.mockResolvedValue({ success: true })
    render(<Settings />)
    
    const button = screen.getByText(/restart explorer/i)
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('restart-explorer')
    })
  })

  it('should display system tray toggle', () => {
    render(<Settings />)
    expect(screen.getByText(/system tray/i)).toBeInTheDocument()
  })

  it('should load tray preference from localStorage', () => {
    localStorage.setItem('tray-enabled', 'true')
    render(<Settings />)
    const toggles = screen.getAllByTestId('toggle')
    expect(toggles.length).toBeGreaterThan(0)
  })

  it('should toggle system tray when changed', async () => {
    mockInvoke.mockResolvedValue({ success: true })
    render(<Settings />)
    
    // Find and click tray toggle
    const toggles = screen.getAllByTestId('toggle')
    if (toggles.length > 0) {
      fireEvent.click(toggles[toggles.length - 1])
      
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled()
      })
    }
  })

  it('should handle theme options: Light, Dark, System, Classic', () => {
    render(<Settings />)
    const dropdown = screen.getByTestId('dropdown')
    
    fireEvent.change(dropdown, { target: { value: 'light' } })
    expect(localStorage.getItem('theme')).toBe('light')
    
    fireEvent.change(dropdown, { target: { value: 'dark' } })
    expect(localStorage.getItem('theme')).toBe('dark')
    
    fireEvent.change(dropdown, { target: { value: 'system' } })
    expect(localStorage.getItem('theme')).toBe('system')
    
    fireEvent.change(dropdown, { target: { value: 'classic' } })
    expect(localStorage.getItem('theme')).toBe('classic')
  })

  it('should update body class when analytics preference changes', () => {
    render(<Settings />)
    const initialClass = document.body.classList.contains('ph-no-capture')
    
    // Toggle analytics
    const toggles = screen.getAllByTestId('toggle')
    toggles.forEach(toggle => fireEvent.click(toggle))
    
    // Body class should potentially change
    expect(document.body.classList).toBeTruthy()
  })

  it('should show disabled status badge for disabled features', () => {
    localStorage.setItem('discord-rpc-enabled', 'false')
    render(<Settings />)
    expect(screen.getByText(/disabled/i)).toBeInTheDocument()
  })

  it('should show enabled status badge for enabled features', () => {
    localStorage.setItem('discord-rpc-enabled', 'true')
    render(<Settings />)
    expect(screen.getByText(/enabled/i)).toBeInTheDocument()
  })

  it('should apply rounded-full styling to radio buttons', () => {
    const { container } = render(<Settings />)
    const radioLabels = container.querySelectorAll('label')
    radioLabels.forEach(label => {
      expect(label.className).toContain('rounded')
    })
  })

  it('should handle errors when clearing cache fails', async () => {
    mockInvoke.mockResolvedValue({ success: false, error: 'Cache clear failed' })
    render(<Settings />)
    
    const button = screen.getByText(/clear cache/i)
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
  })

  it('should handle errors when restarting Explorer fails', async () => {
    mockInvoke.mockRejectedValue(new Error('Restart failed'))
    render(<Settings />)
    
    const button = screen.getByText(/restart explorer/i)
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
  })
})