import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TitleBar from '../../components/titlebar'

vi.mock('../../lib/electron', () => ({
  close: vi.fn(),
  minimize: vi.fn(),
  toggleMaximize: vi.fn()
}))

import { close, minimize, toggleMaximize } from '../../lib/electron'

describe('TitleBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<TitleBar />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render three control buttons', () => {
      render(<TitleBar />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('should have correct height', () => {
      const { container } = render(<TitleBar />)
      const titleBar = container.firstChild
      expect(titleBar).toHaveClass('h-8')
    })

    it('should be positioned fixed', () => {
      const { container } = render(<TitleBar />)
      const titleBar = container.firstChild
      expect(titleBar).toHaveClass('fixed')
    })

    it('should have drag region style', () => {
      const { container } = render(<TitleBar />)
      const titleBar = container.firstChild
      expect(titleBar).toHaveStyle({ WebkitAppRegion: 'drag' })
    })
  })

  describe('Button Icons', () => {
    it('should render minimize icon', () => {
      const { container } = render(<TitleBar />)
      const minimizeButton = screen.getAllByRole('button')[0]
      const icon = minimizeButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render maximize icon', () => {
      const { container } = render(<TitleBar />)
      const maximizeButton = screen.getAllByRole('button')[1]
      const icon = maximizeButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render close icon', () => {
      const { container } = render(<TitleBar />)
      const closeButton = screen.getAllByRole('button')[2]
      const icon = closeButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Button Interactions', () => {
    it('should call minimize when minimize button is clicked', async () => {
      render(<TitleBar />)
      const minimizeButton = screen.getAllByRole('button')[0]
      
      await userEvent.click(minimizeButton)
      
      expect(minimize).toHaveBeenCalledTimes(1)
    })

    it('should call toggleMaximize when maximize button is clicked', async () => {
      render(<TitleBar />)
      const maximizeButton = screen.getAllByRole('button')[1]
      
      await userEvent.click(maximizeButton)
      
      expect(toggleMaximize).toHaveBeenCalledTimes(1)
    })

    it('should call close when close button is clicked', async () => {
      render(<TitleBar />)
      const closeButton = screen.getAllByRole('button')[2]
      
      await userEvent.click(closeButton)
      
      expect(close).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple minimize clicks', async () => {
      render(<TitleBar />)
      const minimizeButton = screen.getAllByRole('button')[0]
      
      await userEvent.click(minimizeButton)
      await userEvent.click(minimizeButton)
      await userEvent.click(minimizeButton)
      
      expect(minimize).toHaveBeenCalledTimes(3)
    })
  })

  describe('Button Styling', () => {
    it('should apply correct width to buttons', () => {
      render(<TitleBar />)
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        expect(button).toHaveClass('w-[46px]')
      })
    })

    it('should apply correct height to buttons', () => {
      render(<TitleBar />)
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        expect(button).toHaveClass('h-8')
      })
    })

    it('should have hover transition on buttons', () => {
      render(<TitleBar />)
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-colors')
      })
    })

    it('should apply special styling to close button', () => {
      render(<TitleBar />)
      const closeButton = screen.getAllByRole('button')[2]
      expect(closeButton).toHaveClass('hover:bg-red-600')
    })
  })

  describe('No-Drag Region', () => {
    it('should set buttons area as no-drag', () => {
      const { container } = render(<TitleBar />)
      const buttonsContainer = container.querySelector('[style*="no-drag"]')
      expect(buttonsContainer).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid button clicks', async () => {
      render(<TitleBar />)
      const buttons = screen.getAllByRole('button')
      
      for (let i = 0; i < 10; i++) {
        await userEvent.click(buttons[0])
        await userEvent.click(buttons[1])
        await userEvent.click(buttons[2])
      }
      
      expect(minimize).toHaveBeenCalledTimes(10)
      expect(toggleMaximize).toHaveBeenCalledTimes(10)
      expect(close).toHaveBeenCalledTimes(10)
    })

    it('should handle clicks when electron functions throw errors', async () => {
      close.mockImplementationOnce(() => {
        throw new Error('Close failed')
      })
      
      render(<TitleBar />)
      const closeButton = screen.getAllByRole('button')[2]
      
      await expect(async () => {
        await userEvent.click(closeButton)
      }).rejects.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have clickable buttons', async () => {
      render(<TitleBar />)
      const buttons = screen.getAllByRole('button')
      
      for (const button of buttons) {
        expect(button).toBeEnabled()
      }
    })

    it('should be keyboard accessible', () => {
      render(<TitleBar />)
      const buttons = screen.getAllByRole('button')
      
      buttons[0].focus()
      expect(buttons[0]).toHaveFocus()
    })
  })
})