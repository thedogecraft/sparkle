import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TitleBar from '../../components/titlebar'

// Mock electron functions
const mockClose = vi.fn()
const mockMinimize = vi.fn()
const mockToggleMaximize = vi.fn()

vi.mock('../../lib/electron', () => ({
  close: () => mockClose(),
  minimize: () => mockMinimize(),
  toggleMaximize: () => mockToggleMaximize(),
}))

describe('TitleBar Component', () => {
  beforeEach(() => {
    mockClose.mockClear()
    mockMinimize.mockClear()
    mockToggleMaximize.mockClear()
  })

  it('should render without crashing', () => {
    render(<TitleBar />)
    const titleBar = document.querySelector('[style*="WebkitAppRegion"]')
    expect(titleBar).toBeInTheDocument()
  })

  it('should have draggable region', () => {
    render(<TitleBar />)
    const titleBar = document.querySelector('[style*="drag"]')
    expect(titleBar).toHaveStyle({ WebkitAppRegion: 'drag' })
  })

  it('should render minimize button', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
  })

  it('should render maximize/restore button', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[1]).toBeInTheDocument()
  })

  it('should render close button', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[2]).toBeInTheDocument()
  })

  it('should call minimize function when minimize button is clicked', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(mockMinimize).toHaveBeenCalledTimes(1)
  })

  it('should call toggleMaximize function when maximize button is clicked', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1])
    expect(mockToggleMaximize).toHaveBeenCalledTimes(1)
  })

  it('should call close function when close button is clicked', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[2])
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should have non-draggable button container', () => {
    render(<TitleBar />)
    const buttonContainer = document.querySelector('[style*="no-drag"]')
    expect(buttonContainer).toHaveStyle({ WebkitAppRegion: 'no-drag' })
  })

  it('should apply correct height to title bar', () => {
    render(<TitleBar />)
    const titleBar = document.querySelector('.h-8')
    expect(titleBar).toBeInTheDocument()
  })

  it('should have fixed positioning', () => {
    render(<TitleBar />)
    const titleBar = document.querySelector('.fixed')
    expect(titleBar).toHaveClass('fixed', 'top-0', 'left-0', 'right-0')
  })

  it('should have proper z-index for layering', () => {
    render(<TitleBar />)
    const titleBar = document.querySelector('.z-50')
    expect(titleBar).toBeInTheDocument()
  })

  it('should apply hover styles to buttons', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveClass('hover:bg-sparkle-accent')
    })
  })

  it('should apply special hover style to close button', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons[2]
    expect(closeButton).toHaveClass('hover:bg-red-600', 'hover:text-white')
  })

  it('should render Minus icon in minimize button', () => {
    render(<TitleBar />)
    const minusIcon = document.querySelector('svg')
    expect(minusIcon).toBeInTheDocument()
  })

  it('should have consistent button dimensions', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveClass('h-8', 'w-[46px]')
    })
  })

  it('should center button content with flexbox', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })
  })

  it('should have transition effects on buttons', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveClass('transition-colors')
    })
  })

  it('should render with transparent background', () => {
    render(<TitleBar />)
    const titleBar = document.querySelector('.bg-transparent')
    expect(titleBar).toBeInTheDocument()
  })

  it('should use small font size', () => {
    render(<TitleBar />)
    const titleBar = document.querySelector('.text-xs')
    expect(titleBar).toBeInTheDocument()
  })

  it('should handle multiple rapid clicks on minimize', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[0])
    expect(mockMinimize).toHaveBeenCalledTimes(3)
  })

  it('should handle multiple rapid clicks on maximize', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[1])
    fireEvent.click(buttons[1])
    expect(mockToggleMaximize).toHaveBeenCalledTimes(2)
  })

  it('should handle multiple rapid clicks on close', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[2])
    fireEvent.click(buttons[2])
    expect(mockClose).toHaveBeenCalledTimes(2)
  })

  it('should maintain button order: minimize, maximize, close', () => {
    render(<TitleBar />)
    const buttons = screen.getAllByRole('button')
    
    // Click each in sequence and verify correct function is called
    fireEvent.click(buttons[0])
    expect(mockMinimize).toHaveBeenCalledTimes(1)
    
    fireEvent.click(buttons[1])
    expect(mockToggleMaximize).toHaveBeenCalledTimes(1)
    
    fireEvent.click(buttons[2])
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should use correct icon sizes', () => {
    render(<TitleBar />)
    const icons = document.querySelectorAll('svg')
    // All icons should have consistent size attributes
    icons.forEach(icon => {
      const size = icon.getAttribute('width') || icon.getAttribute('height')
      expect(size).toBeTruthy()
    })
  })

  it('should have proper spacing for button container', () => {
    render(<TitleBar />)
    const buttonContainer = document.querySelector('.flex')
    expect(buttonContainer).toBeInTheDocument()
  })
})