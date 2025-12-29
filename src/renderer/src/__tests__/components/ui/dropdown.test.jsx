import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown } from '../../../components/ui/dropdown'

describe('Dropdown Component', () => {
  const mockOptions = ['Option 1', 'Option 2', 'Option 3']
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  afterEach(() => {
    // Clean up any portals
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('should render the dropdown button with the current value', () => {
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      expect(screen.getByRole('button')).toHaveTextContent('Option 1')
    })

    it('should render with custom value', () => {
      render(<Dropdown options={mockOptions} value="Custom Value" onChange={mockOnChange} />)
      
      expect(screen.getByRole('button')).toHaveTextContent('Custom Value')
    })

    it('should render chevron icon', () => {
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should not show dropdown menu initially', () => {
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
    })
  })

  describe('Opening and Closing', () => {
    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
    })

    it('should close dropdown when button is clicked again', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
      
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
      })
    })

    it('should rotate chevron icon when opened', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      const chevron = button.querySelector('svg')
      
      expect(chevron).not.toHaveClass('rotate-180')
      
      await user.click(button)
      
      await waitFor(() => {
        expect(chevron).toHaveClass('rotate-180')
      })
    })
  })

  describe('Option Selection', () => {
    it('should call onChange when an option is selected', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Option 2'))
      
      expect(mockOnChange).toHaveBeenCalledWith('Option 2')
      expect(mockOnChange).toHaveBeenCalledTimes(1)
    })

    it('should close dropdown after selecting an option', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Option 3'))
      
      await waitFor(() => {
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
      })
    })

    it('should highlight selected option', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 2" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const selectedOption = screen.getByText('Option 2')
        expect(selectedOption).toHaveClass('text-sparkle-primary')
      })
    })

    it('should allow selecting the same option again', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('Option 1'))
      
      expect(mockOnChange).toHaveBeenCalledWith('Option 1')
    })
  })

  describe('Dropdown Menu Portal', () => {
    it('should render dropdown menu in a portal', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal).toBeInTheDocument()
      })
    })

    it('should position dropdown menu below the button', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal).toHaveStyle({ position: 'fixed' })
      })
    })

    it('should match button width', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal?.style.width).toBeTruthy()
      })
    })
  })

  describe('Click Outside Behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />
          <button>Outside Button</button>
        </div>
      )
      
      const dropdownButton = screen.getByText('Option 1')
      fireEvent.click(dropdownButton)
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
      
      const outsideButton = screen.getByText('Outside Button')
      fireEvent.mouseDown(outsideButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
      })
    })

    it('should not close when clicking inside dropdown menu', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
      
      const portal = document.querySelector('.dropdown-portal')
      if (portal) {
        fireEvent.mouseDown(portal)
      }
      
      // Dropdown should still be open
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })
  })

  describe('Window Resize and Scroll', () => {
    it('should close dropdown on window resize', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
      
      fireEvent(window, new Event('resize'))
      
      await waitFor(() => {
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown on window scroll', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
      
      fireEvent.scroll(window)
      
      await waitFor(() => {
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Accessibility', () => {
    it('should open dropdown with Enter key', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
    })

    it('should open dropdown with Space key', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')
      
      await waitFor(() => {
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Options', () => {
    it('should render all provided options', async () => {
      const manyOptions = ['A', 'B', 'C', 'D', 'E', 'F']
      const user = userEvent.setup()
      render(<Dropdown options={manyOptions} value="A" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        manyOptions.forEach(option => {
          expect(screen.getByText(option)).toBeInTheDocument()
        })
      })
    })

    it('should handle empty options array gracefully', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={[]} value="No options" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      // Should not crash and portal should exist
      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal).toBeInTheDocument()
      })
    })

    it('should handle single option', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={['Only Option']} value="Only Option" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText('Only Option')).toBeInTheDocument()
      })
    })
  })

  describe('Styling and Animation', () => {
    it('should have correct button styling', () => {
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-full')
      expect(button).toHaveClass('border-sparkle-border')
    })

    it('should apply hover styles to non-selected options', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const option2 = screen.getByText('Option 2')
        expect(option2).toHaveClass('hover:bg-sparkle-border/50')
      })
    })

    it('should apply selected option styling', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        const selectedOption = screen.getByText('Option 1')
        expect(selectedOption).toHaveClass('text-sparkle-primary')
        expect(selectedOption).toHaveClass('bg-sparkle-primary/10')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long option text', async () => {
      const longOption = 'A'.repeat(100)
      const user = userEvent.setup()
      render(<Dropdown options={[longOption]} value={longOption} onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        expect(screen.getByText(longOption)).toBeInTheDocument()
      })
    })

    it('should handle special characters in options', async () => {
      const specialOptions = ['Option <1>', 'Option & 2', 'Option "3"']
      const user = userEvent.setup()
      render(<Dropdown options={specialOptions} value={specialOptions[0]} onChange={mockOnChange} />)
      
      await user.click(screen.getByRole('button'))
      
      await waitFor(() => {
        specialOptions.forEach(option => {
          expect(screen.getByText(option)).toBeInTheDocument()
        })
      })
    })

    it('should handle rapid open/close cycles', async () => {
      const user = userEvent.setup()
      render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
      
      const button = screen.getByRole('button')
      
      // Rapidly toggle 10 times
      for (let i = 0; i < 10; i++) {
        await user.click(button)
      }
      
      // Component should not crash
      expect(button).toBeInTheDocument()
    })
  })
})