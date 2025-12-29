import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../../pages/Home'

// Mock stores
vi.mock('@/stores/systemStore', () => ({
  default: vi.fn((selector) => {
    const state = {
      systemInfo: {
        cpu: 'Intel Core i7',
        gpu: 'NVIDIA RTX 3080',
        ram: '16 GB',
        os: 'Windows 11',
      },
      setSystemInfo: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('@/stores/tweakStore', () => ({
  default: vi.fn((selector) => {
    const state = {
      tweaks: [
        { id: 1, name: 'Test Tweak 1', applied: true },
        { id: 2, name: 'Test Tweak 2', applied: false },
      ],
      setTweaks: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

// Mock components
vi.mock('../../components/greeting', () => ({
  default: () => <div data-testid="greeting">Greeting Component</div>,
}))

vi.mock('../../components/ui/Card', () => ({
  default: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
}))

// Mock invoke
const mockInvoke = vi.fn()
vi.mock('@/lib/electron', () => ({
  invoke: (...args) => mockInvoke(...args),
}))

describe('Home Component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockInvoke.mockClear()
  })

  it('should render without crashing', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByTestId('greeting')).toBeInTheDocument()
  })

  it('should display greeting component', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByTestId('greeting')).toBeInTheDocument()
  })

  it('should display system information cards', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByText(/Intel Core i7/i)).toBeInTheDocument()
    expect(screen.getByText(/NVIDIA RTX 3080/i)).toBeInTheDocument()
    expect(screen.getByText(/16 GB/i)).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    // Component should render even while loading
    const cards = screen.getAllByTestId('card')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('should fetch system information on mount', async () => {
    mockInvoke.mockResolvedValue({
      success: true,
      data: {
        cpu: 'AMD Ryzen 9',
        gpu: 'AMD RX 6800',
        ram: '32 GB',
      },
    })
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('get-system-info')
    })
  })

  it('should display active tweaks count', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByText(/1.*active/i)).toBeInTheDocument()
  })

  it('should display total tweaks count', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByText(/2.*available/i)).toBeInTheDocument()
  })

  it('should render tweaks call-to-action card', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByText(/open tweaks/i)).toBeInTheDocument()
  })

  it('should use grid layout for info cards', () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3')
  })

  it('should apply gap between cards', () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('gap-3')
  })

  it('should cache system info in localStorage', async () => {
    mockInvoke.mockResolvedValue({
      success: true,
      data: { cpu: 'Test CPU' },
    })
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    
    await waitFor(() => {
      const cached = localStorage.getItem('system-info-cache')
      expect(cached).toBeTruthy()
    })
  })

  it('should use cached system info if available', () => {
    const cachedData = {
      data: { cpu: 'Cached CPU' },
      timestamp: Date.now(),
    }
    localStorage.setItem('system-info-cache', JSON.stringify(cachedData))
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/Cached CPU/i)).toBeInTheDocument()
  })

  it('should handle system info fetch failure', async () => {
    mockInvoke.mockResolvedValue({ success: false })
    
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })
  })

  it('should display OS information', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    expect(screen.getByText(/Windows 11/i)).toBeInTheDocument()
  })

  it('should render with max-width constraint', () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    const maxWidthDiv = container.querySelector('.max-w-\\[1800px\\]')
    expect(maxWidthDiv).toBeInTheDocument()
  })

  it('should center content with mx-auto', () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )
    const centeredDiv = container.querySelector('.mx-auto')
    expect(centeredDiv).toBeInTheDocument()
  })
})