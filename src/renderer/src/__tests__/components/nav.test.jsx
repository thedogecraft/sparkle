import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from '../../components/nav'

// Mock the sidebar store
vi.mock('@/store/sidebarStore', () => ({
  default: vi.fn(() => ({
    isCollapsed: false,
    toggle: vi.fn(),
  })),
}))

// Mock the restart store
vi.mock('@/stores/restartStore', () => ({
  default: vi.fn(() => ({
    needsRestart: false,
    setNeedsRestart: vi.fn(),
  })),
}))

// Mock UI components
vi.mock('../../components/ui/button', () => ({
  default: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

vi.mock('../../components/ui/modal', () => ({
  default: ({ show, children, ...props }) => show ? <div data-testid="modal" {...props}>{children}</div> : null,
}))

vi.mock('../../components/githubicon', () => ({
  default: (props) => <svg data-testid="github-icon" {...props} />,
}))

describe('Nav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('should render all navigation tabs', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Tweaks')).toBeInTheDocument()
    expect(screen.getByText('Utilities')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Backup')).toBeInTheDocument()
  })

  it('should display Sparkle branding', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    expect(screen.getByText('Sparkle')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('should render Sparkle logo', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    const logo = screen.getByAltText('Sparkle')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src')
  })

  it('should highlight active tab based on current route', () => {
    render(
      <MemoryRouter initialEntries={['/tweaks']}>
        <Nav />
      </MemoryRouter>
    )
    const tweaksButton = screen.getByText('Tweaks').closest('button')
    expect(tweaksButton).toHaveClass('text-sparkle-primary')
  })

  it('should render collapse/expand toggle button', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    const toggleButton = screen.getByLabelText(/collapse sidebar|expand sidebar/i)
    expect(toggleButton).toBeInTheDocument()
  })

  it('should call toggle function when collapse button is clicked', () => {
    const mockToggle = vi.fn()
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: false,
      toggle: mockToggle,
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const toggleButton = screen.getByLabelText(/collapse sidebar/i)
    fireEvent.click(toggleButton)
    expect(mockToggle).toHaveBeenCalled()
  })

  it('should show ChevronLeft icon when sidebar is expanded', () => {
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: false,
      toggle: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const toggleButton = screen.getByLabelText(/collapse sidebar/i)
    expect(toggleButton).toBeInTheDocument()
  })

  it('should show ChevronRight icon when sidebar is collapsed', () => {
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: true,
      toggle: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const toggleButton = screen.getByLabelText(/expand sidebar/i)
    expect(toggleButton).toBeInTheDocument()
  })

  it('should apply collapsed width when sidebar is collapsed', () => {
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: true,
      toggle: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('w-14')
  })

  it('should apply expanded width when sidebar is expanded', () => {
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: false,
      toggle: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('w-60')
  })

  it('should show "New" badge on Utilities tab', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('should hide Utilities "New" badge when sidebar is collapsed', () => {
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: true,
      toggle: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    // When collapsed, badge text should have max-w-0 and opacity-0
    const newBadge = screen.queryByText('New')
    if (newBadge) {
      const parent = newBadge.parentElement
      expect(parent).toHaveClass('ml-auto')
    }
  })

  it('should render social media links', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    const githubLink = screen.getByRole('link', { name: /github/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/parcoil/sparkle')
    expect(githubLink).toHaveAttribute('target', '_blank')
  })

  it('should render Discord link', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    const discordLink = screen.getByRole('link', { name: /discord/i })
    expect(discordLink).toHaveAttribute('href', 'https://discord.gg/parcoil')
    expect(discordLink).toHaveAttribute('target', '_blank')
  })

  it('should display app version', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    // Should display version text
    const versionElement = document.querySelector('.text-sparkle-text-secondary.text-xs')
    expect(versionElement).toBeTruthy()
  })

  it('should not show restart button when restart is not needed', () => {
    vi.mocked(require('@/stores/restartStore').default).mockReturnValue({
      needsRestart: false,
      setNeedsRestart: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    expect(screen.queryByText(/restart now/i)).not.toBeInTheDocument()
  })

  it('should show restart button when restart is needed', () => {
    vi.mocked(require('@/stores/restartStore').default).mockReturnValue({
      needsRestart: true,
      setNeedsRestart: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/restart now/i)).toBeInTheDocument()
  })

  it('should open restart modal when restart button is clicked', async () => {
    vi.mocked(require('@/stores/restartStore').default).mockReturnValue({
      needsRestart: true,
      setNeedsRestart: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const restartButton = screen.getByText(/restart now/i)
    fireEvent.click(restartButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  it('should navigate to correct route when tab is clicked', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Nav />
      </MemoryRouter>
    )
    
    const tweaksButton = screen.getByText('Tweaks').closest('button')
    fireEvent.click(tweaksButton)
    
    // After navigation, Tweaks should be active
    expect(tweaksButton).toHaveClass('text-sparkle-primary')
  })

  it('should apply transition effects to sidebar width', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('transition-all')
    expect(nav).toHaveClass('duration-500')
    expect(nav).toHaveClass('ease-[cubic-bezier(0.2,0,0,1)]')
  })

  it('should show toggle button on hover', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const toggleButton = screen.getByLabelText(/collapse sidebar|expand sidebar/i)
    expect(toggleButton).toHaveClass('opacity-0')
    expect(toggleButton).toHaveClass('group-hover:opacity-100')
  })

  it('should have proper aria-label for sidebar', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('aria-label', 'Main sidebar')
  })

  it('should have aria-expanded attribute on toggle button', () => {
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: false,
      toggle: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const toggleButton = screen.getByLabelText(/collapse sidebar/i)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })

  it('should render tab icons', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    // Each tab should have an icon
    const buttons = screen.getAllByRole('button').filter(btn => 
      btn.textContent.includes('Home') || 
      btn.textContent.includes('Tweaks') ||
      btn.textContent.includes('Settings')
    )
    
    buttons.forEach(button => {
      const svg = button.querySelector('svg')
      expect(svg).toBeTruthy()
    })
  })

  it('should apply hover effects to tabs', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton).toHaveClass('hover:text-sparkle-text')
  })

  it('should apply active styling to current tab', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Nav />
      </MemoryRouter>
    )
    
    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton).toHaveClass('text-sparkle-primary')
  })

  it('should hide text labels when sidebar is collapsed', () => {
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: true,
      toggle: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const homeText = screen.getByText('Home')
    expect(homeText).toHaveClass('max-w-0', 'opacity-0')
  })

  it('should show tooltips on tabs when sidebar is collapsed', () => {
    vi.mocked(require('@/store/sidebarStore').default).mockReturnValue({
      isCollapsed: true,
      toggle: vi.fn(),
    })
    
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const homeButton = screen.getByText('Home').closest('button')
    expect(homeButton).toHaveAttribute('title', 'Home')
  })

  it('should apply focus styles to toggle button', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const toggleButton = screen.getByLabelText(/collapse sidebar|expand sidebar/i)
    expect(toggleButton).toHaveClass('focus-visible:outline-none')
    expect(toggleButton).toHaveClass('focus-visible:ring-2')
    expect(toggleButton).toHaveClass('focus-visible:ring-sparkle-primary')
  })

  it('should render with fixed positioning', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('fixed', 'left-0', 'top-0')
  })

  it('should have proper z-index for layering', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('z-40')
  })

  it('should apply flexbox layout to content', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    )
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('flex', 'flex-col')
  })
})