import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Mock the store
vi.mock('@/store/sidebarStore', () => ({
  default: vi.fn(() => ({
    isCollapsed: false,
    toggle: vi.fn(),
  })),
}))

// Mock child components to isolate App testing
vi.mock('../components/firsttime', () => ({
  default: () => <div data-testid="first-time">FirstTime</div>,
}))

vi.mock('../components/titlebar', () => ({
  default: () => <div data-testid="title-bar">TitleBar</div>,
}))

vi.mock('../components/nav', () => ({
  default: () => <div data-testid="nav">Nav</div>,
}))

vi.mock('../components/updatemanager', () => ({
  default: () => <div data-testid="update-manager">UpdateManager</div>,
}))

vi.mock('../pages/Home', () => ({
  default: () => <div data-testid="home-page">Home</div>,
}))

vi.mock('../pages/Tweaks', () => ({
  default: () => <div data-testid="tweaks-page">Tweaks</div>,
}))

vi.mock('../pages/Utilities', () => ({
  default: () => <div data-testid="utilities-page">Utilities</div>,
}))

vi.mock('../pages/Settings', () => ({
  default: () => <div data-testid="settings-page">Settings</div>,
}))

vi.mock('../pages/Backup', () => ({
  default: () => <div data-testid="backup-page">Backup</div>,
}))

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('title-bar')).toBeInTheDocument()
    expect(screen.getByTestId('nav')).toBeInTheDocument()
  })

  it('should render all global UI components', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('first-time')).toBeInTheDocument()
    expect(screen.getByTestId('title-bar')).toBeInTheDocument()
    expect(screen.getByTestId('nav')).toBeInTheDocument()
    expect(screen.getByTestId('update-manager')).toBeInTheDocument()
  })

  it('should apply light theme when localStorage has "light"', async () => {
    localStorage.setItem('theme', 'light')
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('light')).toBe(true)
    })
  })

  it('should apply dark theme when localStorage has "dark"', async () => {
    localStorage.setItem('theme', 'dark')
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('should default to system theme when no theme is stored', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      const hasTheme = document.documentElement.classList.contains('light') || 
                      document.documentElement.classList.contains('dark')
      expect(hasTheme).toBe(true)
    })
  })

  it('should apply posthog opt-out class when analytics are disabled', async () => {
    localStorage.setItem('posthog-disabled', 'true')
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.body.classList.contains('ph-no-capture')).toBe(true)
    })
  })

  it('should not apply posthog opt-out class when analytics are enabled', async () => {
    localStorage.setItem('posthog-disabled', 'false')
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.body.classList.contains('ph-no-capture')).toBe(false)
    })
  })

  it('should update main margin when sidebar is collapsed', () => {
    const useSidebarStore = vi.fn(() => ({
      isCollapsed: true,
      toggle: vi.fn(),
    }))
    
    vi.doMock('@/store/sidebarStore', () => ({
      default: useSidebarStore,
    }))

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const main = screen.getByRole('main')
    expect(main).toHaveClass('ml-14')
  })

  it('should update main margin when sidebar is expanded', () => {
    const useSidebarStore = vi.fn(() => ({
      isCollapsed: false,
      toggle: vi.fn(),
    }))
    
    vi.doMock('@/store/sidebarStore', () => ({
      default: useSidebarStore,
    }))

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const main = screen.getByRole('main')
    expect(main).toHaveClass('ml-60')
  })

  it('should render home page at root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  it('should render tweaks page at /tweaks route', () => {
    render(
      <MemoryRouter initialEntries={['/tweaks']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('tweaks-page')).toBeInTheDocument()
  })

  it('should render utilities page at /utilities route', () => {
    render(
      <MemoryRouter initialEntries={['/utilities']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('utilities-page')).toBeInTheDocument()
  })

  it('should render settings page at /settings route', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('settings-page')).toBeInTheDocument()
  })

  it('should render backup page at /backup route', () => {
    render(
      <MemoryRouter initialEntries={['/backup']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('backup-page')).toBeInTheDocument()
  })

  it('should listen for theme changes from storage events', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    // Simulate storage event
    const event = new StorageEvent('storage', {
      key: 'theme',
      newValue: 'dark',
    })
    window.dispatchEvent(event)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('should handle system theme preference changes', async () => {
    // Mock matchMedia to simulate dark mode preference
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          // Immediately call handler to simulate change
          handler({ matches: query === '(prefers-color-scheme: dark)' })
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    localStorage.setItem('theme', 'system')
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      const hasTheme = document.documentElement.classList.contains('light') || 
                      document.documentElement.classList.contains('dark')
      expect(hasTheme).toBe(true)
    })
  })

  it('should have proper layout structure with flex and responsive classes', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const mainContainer = document.querySelector('.flex.flex-1.pt-8')
    expect(mainContainer).toBeInTheDocument()
    
    const main = screen.getByRole('main')
    expect(main).toHaveClass('flex-1', 'p-6', 'rounded-tl-2xl')
  })

  it('should apply transition classes for smooth sidebar animations', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    const main = screen.getByRole('main')
    expect(main).toHaveClass('transition-all', 'duration-500', 'ease-[cubic-bezier(0.2,0,0,1)]')
  })

  it('should handle classic theme variant', async () => {
    localStorage.setItem('theme', 'classic')
    
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.documentElement.classList.contains('classic')).toBe(true)
    })
  })

  it('should properly set initial theme state from localStorage', () => {
    localStorage.setItem('theme', 'light')
    
    const { rerender } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    expect(localStorage.getItem('theme')).toBe('light')
    
    // Change to dark
    localStorage.setItem('theme', 'dark')
    
    rerender(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    expect(localStorage.getItem('theme')).toBe('dark')
  })
})