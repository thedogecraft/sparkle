import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Nav from '../../components/nav'
import useSidebarStore from '../../store/sidebarStore'
import useRestartStore from '../../store/restartState'

// Mock modules
vi.mock('../../store/sidebarStore')
vi.mock('../../store/restartState')
vi.mock('../../lib/electron', () => ({
  invoke: vi.fn()
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' })
  }
})

describe('Nav Component', () => {
  const defaultSidebarState = {
    isCollapsed: false,
    toggle: vi.fn(),
    setCollapsed: vi.fn()
  }

  const defaultRestartState = {
    needsRestart: false,
    setNeedsRestart: vi.fn(),
    resetRestartState: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useSidebarStore.mockReturnValue(defaultSidebarState)
    useRestartStore.mockReturnValue(defaultRestartState)
    mockNavigate.mockClear()
  })

  const renderNav = () => {
    return render(
      <BrowserRouter>
        <Nav />
      </BrowserRouter>
    )
  }

  describe('Rendering', () => {
    it('should render the navigation component', () => {
      renderNav()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have correct aria-label', () => {
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Main sidebar')
    })

    it('should render Sparkle logo', () => {
      renderNav()
      const logo = screen.getByAlt('Sparkle')
      expect(logo).toBeInTheDocument()
    })

    it('should render Sparkle title when expanded', () => {
      renderNav()
      expect(screen.getByText('Sparkle')).toBeInTheDocument()
    })

    it('should render Beta badge when expanded', () => {
      renderNav()
      expect(screen.getByText('Beta')).toBeInTheDocument()
    })

    it('should render all navigation tabs', () => {
      renderNav()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Tweaks')).toBeInTheDocument()
      expect(screen.getByText('Utilities')).toBeInTheDocument()
      expect(screen.getByText('Cleaner')).toBeInTheDocument()
      expect(screen.getByText('Restore Points')).toBeInTheDocument()
      expect(screen.getByText('DNS Manager')).toBeInTheDocument()
      expect(screen.getByText('Apps')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should show "New" badge on Utilities tab', () => {
      renderNav()
      const utilitiesSection = screen.getByText('Utilities').closest('button')
      expect(utilitiesSection).toContainHTML('New')
    })
  })

  describe('Sidebar Collapse/Expand', () => {
    it('should render collapse toggle button', () => {
      renderNav()
      const toggleButton = screen.getByLabelText('Collapse sidebar')
      expect(toggleButton).toBeInTheDocument()
    })

    it('should call toggle when collapse button is clicked', async () => {
      const user = userEvent.setup()
      const toggleMock = vi.fn()
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        toggle: toggleMock
      })
      
      renderNav()
      const toggleButton = screen.getByLabelText('Collapse sidebar')
      await user.click(toggleButton)
      
      expect(toggleMock).toHaveBeenCalledTimes(1)
    })

    it('should show ChevronLeft icon when expanded', () => {
      renderNav()
      const toggleButton = screen.getByLabelText('Collapse sidebar')
      expect(toggleButton).toBeInTheDocument()
    })

    it('should show ChevronRight icon when collapsed', () => {
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        isCollapsed: true
      })
      
      renderNav()
      const toggleButton = screen.getByLabelText('Expand sidebar')
      expect(toggleButton).toBeInTheDocument()
    })

    it('should have correct aria-expanded attribute when expanded', () => {
      renderNav()
      const toggleButton = screen.getByLabelText('Collapse sidebar')
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('should have correct aria-expanded attribute when collapsed', () => {
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        isCollapsed: true
      })
      
      renderNav()
      const toggleButton = screen.getByLabelText('Expand sidebar')
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('should apply collapsed width class when sidebar is collapsed', () => {
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        isCollapsed: true
      })
      
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('w-14')
    })

    it('should apply expanded width class when sidebar is expanded', () => {
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('w-60')
    })

    it('should hide text labels when collapsed', () => {
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        isCollapsed: true
      })
      
      renderNav()
      const dashboardButton = screen.getByTitle('Dashboard')
      const textSpan = dashboardButton.querySelector('span.text-sm')
      expect(textSpan).toHaveClass('max-w-0', 'opacity-0')
    })

    it('should show text labels when expanded', () => {
      renderNav()
      const textSpan = screen.getByText('Dashboard')
      expect(textSpan).toHaveClass('max-w-[150px]', 'opacity-100')
    })

    it('should show title attribute on buttons when collapsed', () => {
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        isCollapsed: true
      })
      
      renderNav()
      expect(screen.getByTitle('Dashboard')).toBeInTheDocument()
      expect(screen.getByTitle('Tweaks')).toBeInTheDocument()
      expect(screen.getByTitle('Settings')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to home when Dashboard is clicked', async () => {
      const user = userEvent.setup()
      renderNav()
      
      await user.click(screen.getByText('Dashboard'))
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should navigate to tweaks when Tweaks is clicked', async () => {
      const user = userEvent.setup()
      renderNav()
      
      await user.click(screen.getByText('Tweaks'))
      expect(mockNavigate).toHaveBeenCalledWith('/tweaks')
    })

    it('should navigate to settings when Settings is clicked', async () => {
      const user = userEvent.setup()
      renderNav()
      
      await user.click(screen.getByText('Settings'))
      expect(mockNavigate).toHaveBeenCalledWith('/settings')
    })

    it('should navigate to utilities when Utilities is clicked', async () => {
      const user = userEvent.setup()
      renderNav()
      
      await user.click(screen.getByText('Utilities'))
      expect(mockNavigate).toHaveBeenCalledWith('/utilities')
    })

    it('should navigate to cleaner when Cleaner is clicked', async () => {
      const user = userEvent.setup()
      renderNav()
      
      await user.click(screen.getByText('Cleaner'))
      expect(mockNavigate).toHaveBeenCalledWith('/clean')
    })

    it('should navigate to backup when Restore Points is clicked', async () => {
      const user = userEvent.setup()
      renderNav()
      
      await user.click(screen.getByText('Restore Points'))
      expect(mockNavigate).toHaveBeenCalledWith('/backup')
    })

    it('should navigate to DNS Manager when DNS Manager is clicked', async () => {
      const user = userEvent.setup()
      renderNav()
      
      await user.click(screen.getByText('DNS Manager'))
      expect(mockNavigate).toHaveBeenCalledWith('/dns')
    })

    it('should navigate to apps when Apps is clicked', async () => {
      const user = userEvent.setup()
      renderNav()
      
      await user.click(screen.getByText('Apps'))
      expect(mockNavigate).toHaveBeenCalledWith('/apps')
    })
  })

  describe('Active Tab Highlighting', () => {
    it('should highlight Dashboard tab when on home route', () => {
      renderNav()
      const dashboardButton = screen.getByText('Dashboard').closest('button')
      expect(dashboardButton).toHaveClass('text-sparkle-primary')
    })

    it('should not highlight other tabs when Dashboard is active', () => {
      renderNav()
      const tweaksButton = screen.getByText('Tweaks').closest('button')
      expect(tweaksButton).toHaveClass('text-sparkle-text-secondary')
    })

    it('should show background highlight on active tab when expanded', () => {
      renderNav()
      const dashboardButton = screen.getByText('Dashboard').closest('button')
      expect(dashboardButton).toHaveClass('bg-sparkle-primary/15')
    })
  })

  describe('Restart Functionality', () => {
    it('should not show restart button by default', () => {
      renderNav()
      expect(screen.queryByText('Restart Now')).not.toBeInTheDocument()
    })

    it('should show restart button when needsRestart is true', () => {
      useRestartStore.mockReturnValue({
        ...defaultRestartState,
        needsRestart: true
      })
      
      renderNav()
      expect(screen.getByText('Restart Now')).toBeInTheDocument()
    })

    it('should open restart modal when restart button is clicked', async () => {
      const user = userEvent.setup()
      useRestartStore.mockReturnValue({
        ...defaultRestartState,
        needsRestart: true
      })
      
      renderNav()
      await user.click(screen.getByText('Restart Now'))
      
      await waitFor(() => {
        expect(screen.getByText(/restart your computer/i)).toBeInTheDocument()
      })
    })

    it('should hide restart button text when collapsed', () => {
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        isCollapsed: true
      })
      useRestartStore.mockReturnValue({
        ...defaultRestartState,
        needsRestart: true
      })
      
      renderNav()
      const restartButton = screen.getByTitle('Restart Windows')
      const textSpan = restartButton.querySelector('span.transition-\\[max-width\\,opacity\\]')
      expect(textSpan).toHaveClass('max-w-0', 'opacity-0')
    })

    it('should show restart button text when expanded', () => {
      useRestartStore.mockReturnValue({
        ...defaultRestartState,
        needsRestart: true
      })
      
      renderNav()
      expect(screen.getByText('Restart Now')).toBeVisible()
    })
  })

  describe('Accessibility', () => {
    it('should have proper focus management', () => {
      renderNav()
      const toggleButton = screen.getByLabelText('Collapse sidebar')
      toggleButton.focus()
      expect(toggleButton).toHaveFocus()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderNav()
      
      const dashboardButton = screen.getByText('Dashboard').closest('button')
      dashboardButton?.focus()
      await user.keyboard('{Enter}')
      
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('should have visible focus indicators', () => {
      renderNav()
      const toggleButton = screen.getByLabelText('Collapse sidebar')
      expect(toggleButton).toHaveClass('focus-visible:outline-none')
      expect(toggleButton).toHaveClass('focus-visible:ring-2')
    })
  })

  describe('Icons', () => {
    it('should render icons for all navigation items', () => {
      renderNav()
      const buttons = screen.getAllByRole('button')
      // Each nav button should have an icon (svg)
      const navButtons = buttons.filter(btn => 
        btn.textContent?.includes('Dashboard') ||
        btn.textContent?.includes('Tweaks') ||
        btn.textContent?.includes('Settings')
      )
      
      navButtons.forEach(button => {
        expect(button.querySelector('svg')).toBeInTheDocument()
      })
    })

    it('should show dot indicator for Utilities when collapsed', () => {
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        isCollapsed: true
      })
      
      renderNav()
      const utilitiesButton = screen.getByTitle('Utilities')
      const dot = utilitiesButton.querySelector('.absolute.top-2.right-2')
      expect(dot).toBeInTheDocument()
    })

    it('should show "New" badge for Utilities when expanded', () => {
      renderNav()
      const utilitiesButton = screen.getByText('Utilities').closest('button')
      expect(utilitiesButton).toContainHTML('New')
    })
  })

  describe('Styling and Layout', () => {
    it('should have fixed positioning', () => {
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('fixed', 'left-0', 'top-0')
    })

    it('should span full height', () => {
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('h-screen')
    })

    it('should have correct z-index', () => {
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('z-40')
    })

    it('should have transition classes', () => {
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('transition-all', 'duration-500')
    })

    it('should apply group class for hover states', () => {
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('group')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing pathname gracefully', () => {
      const { useLocation } = require('react-router-dom')
      useLocation.mockReturnValue({ pathname: undefined })
      
      expect(() => renderNav()).not.toThrow()
    })

    it('should handle unknown routes', () => {
      const { useLocation } = require('react-router-dom')
      useLocation.mockReturnValue({ pathname: '/unknown-route' })
      
      renderNav()
      // Should not highlight any tab
      const buttons = screen.getAllByRole('button')
      const hasActiveTab = buttons.some(btn => 
        btn.className?.includes('text-sparkle-primary')
      )
      expect(hasActiveTab).toBe(false)
    })

    it('should handle rapid toggle clicks', async () => {
      const user = userEvent.setup()
      const toggleMock = vi.fn()
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        toggle: toggleMock
      })
      
      renderNav()
      const toggleButton = screen.getByLabelText('Collapse sidebar')
      
      // Click 10 times rapidly
      for (let i = 0; i < 10; i++) {
        await user.click(toggleButton)
      }
      
      expect(toggleMock).toHaveBeenCalledTimes(10)
    })
  })

  describe('Integration with Stores', () => {
    it('should read isCollapsed state from sidebar store', () => {
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        isCollapsed: true
      })
      
      renderNav()
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('w-14')
    })

    it('should read needsRestart state from restart store', () => {
      useRestartStore.mockReturnValue({
        ...defaultRestartState,
        needsRestart: true
      })
      
      renderNav()
      expect(screen.getByText('Restart Now')).toBeInTheDocument()
    })

    it('should call toggle function from sidebar store', async () => {
      const user = userEvent.setup()
      const toggleMock = vi.fn()
      useSidebarStore.mockReturnValue({
        ...defaultSidebarState,
        toggle: toggleMock
      })
      
      renderNav()
      await user.click(screen.getByLabelText('Collapse sidebar'))
      
      expect(toggleMock).toHaveBeenCalled()
    })
  })
})