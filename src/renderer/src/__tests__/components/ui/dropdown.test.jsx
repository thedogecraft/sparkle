import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown } from '../../../components/ui/dropdown'

describe('Dropdown Component', () => {
  const defaultOptions = ['Option 1', 'Option 2', 'Option 3']
  const defaultValue = 'Option 1'
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('should render with default value', () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(defaultValue)).toBeInTheDocument()
    })

    it('should render chevron icon', () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const chevronIcon = document.querySelector('svg')
      expect(chevronIcon).toBeInTheDocument()
    })

    it('should not show dropdown menu initially', () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const portal = document.querySelector('.dropdown-portal')
      expect(portal).not.toBeInTheDocument()
    })

    it('should apply correct initial classes', () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-full', 'border')
    })
  })

  describe('Interaction - Opening/Closing', () => {
    it('should open dropdown when clicked', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal).toBeInTheDocument()
      })
    })

    it('should show all options when opened', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        defaultOptions.forEach(option => {
          const optionElement = screen.getAllByText(option).find(
            el => el.closest('.dropdown-portal')
          )
          expect(optionElement).toBeInTheDocument()
        })
      })
    })

    it('should rotate chevron icon when opened', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      const chevron = button.querySelector('svg')

      expect(chevron).not.toHaveClass('rotate-180')

      await userEvent.click(button)

      await waitFor(() => {
        expect(chevron).toHaveClass('rotate-180')
      })
    })

    it('should close dropdown when button clicked again', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      
      await userEvent.click(button)
      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).toBeInTheDocument()
      })

      await userEvent.click(button)
      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <Dropdown
            options={defaultOptions}
            value={defaultValue}
            onChange={mockOnChange}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).toBeInTheDocument()
      })

      const outside = screen.getByTestId('outside')
      fireEvent.mouseDown(outside)

      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Option Selection', () => {
    it('should call onChange when option is selected', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal).toBeInTheDocument()
      })

      const option = screen.getAllByText('Option 2').find(
        el => el.closest('.dropdown-portal')
      )
      
      if (option) {
        await userEvent.click(option)
        expect(mockOnChange).toHaveBeenCalledWith('Option 2')
        expect(mockOnChange).toHaveBeenCalledTimes(1)
      }
    })

    it('should close dropdown after selecting an option', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).toBeInTheDocument()
      })

      const option = screen.getAllByText('Option 2').find(
        el => el.closest('.dropdown-portal')
      )
      
      if (option) {
        await userEvent.click(option)
        
        await waitFor(() => {
          expect(document.querySelector('.dropdown-portal')).not.toBeInTheDocument()
        })
      }
    })

    it('should highlight selected option', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal).toBeInTheDocument()
        
        const selectedOption = screen.getAllByText(defaultValue).find(
          el => el.closest('.dropdown-portal')
        )
        
        if (selectedOption) {
          expect(selectedOption).toHaveClass('text-sparkle-primary')
        }
      })
    })
  })

  describe('Positioning', () => {
    it('should calculate portal position when opened', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal).toBeInTheDocument()
        expect(portal).toHaveStyle({ position: 'fixed' })
      })
    })

    it('should match button width', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        const portal = document.querySelector('.dropdown-portal')
        expect(portal).toBeInTheDocument()
        // Portal should have width style set
        expect(portal?.style.width).toBeTruthy()
      })
    })
  })

  describe('Window Events', () => {
    it('should close dropdown on window resize', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).toBeInTheDocument()
      })

      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown on window scroll', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).toBeInTheDocument()
      })

      fireEvent(window, new Event('scroll'))

      await waitFor(() => {
        expect(document.querySelector('.dropdown-portal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(
        <Dropdown
          options={[]}
          value=""
          onChange={mockOnChange}
        />
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle single option', async () => {
      render(
        <Dropdown
          options={['Only Option']}
          value="Only Option"
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      await waitFor(() => {
        const options = screen.getAllByText('Only Option')
        expect(options.length).toBeGreaterThan(0)
      })
    })

    it('should handle long option text', async () => {
      const longText = 'This is a very long option text that should be handled properly'
      render(
        <Dropdown
          options={[longText]}
          value={longText}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('should handle rapid open/close operations', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      
      for (let i = 0; i < 5; i++) {
        await userEvent.click(button)
        await userEvent.click(button)
      }
      
      // Should end in closed state
      expect(document.querySelector('.dropdown-portal')).not.toBeInTheDocument()
    })

    it('should handle value not in options', () => {
      render(
        <Dropdown
          options={defaultOptions}
          value="Non-existent Option"
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Non-existent Option')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      render(
        <Dropdown
          options={defaultOptions}
          value={defaultValue}
          onChange={mockOnChange}
        />
      )

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })
  })
})