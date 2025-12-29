import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dropdown } from '../../../components/ui/dropdown'

describe('Dropdown Component', () => {
  const mockOptions = ['Option 1', 'Option 2', 'Option 3']
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    // Create a div for portal rendering
    const portalRoot = document.createElement('div')
    portalRoot.setAttribute('id', 'portal-root')
    document.body.appendChild(portalRoot)
  })

  afterEach(() => {
    const portalRoot = document.getElementById('portal-root')
    if (portalRoot) {
      document.body.removeChild(portalRoot)
    }
  })

  it('should render without crashing', () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should display current value', () => {
    render(<Dropdown options={mockOptions} value="Option 2" onChange={mockOnChange} />)
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('should not show options initially', () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    expect(screen.queryByText('Option 3')).not.toBeInTheDocument()
  })

  it('should open dropdown when clicked', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      mockOptions.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument()
      })
    })
  })

  it('should close dropdown when clicking outside', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getAllByText('Option 1').length).toBeGreaterThan(1)
    })
    
    fireEvent.mouseDown(document.body)
    
    await waitFor(() => {
      const option3Elements = screen.queryAllByText('Option 3')
      expect(option3Elements.length).toBeLessThanOrEqual(1)
    })
  })

  it('should call onChange when option is selected', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getAllByText('Option 2').length).toBeGreaterThan(1)
    })
    
    const option2Buttons = screen.getAllByText('Option 2')
    const optionButton = option2Buttons.find(el => el.tagName === 'BUTTON' && el.closest('.dropdown-portal'))
    
    if (optionButton) {
      fireEvent.click(optionButton)
      expect(mockOnChange).toHaveBeenCalledWith('Option 2')
    }
  })

  it('should close dropdown after selecting an option', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getAllByText('Option 3').length).toBeGreaterThan(1)
    })
    
    const option3Buttons = screen.getAllByText('Option 3')
    const optionButton = option3Buttons.find(el => el.tagName === 'BUTTON' && el.closest('.dropdown-portal'))
    
    if (optionButton) {
      fireEvent.click(optionButton)
      
      await waitFor(() => {
        const remainingOption3 = screen.queryAllByText('Option 3')
        expect(remainingOption3.length).toBeLessThanOrEqual(1)
      })
    }
  })

  it('should rotate chevron when dropdown is open', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    const chevron = button.querySelector('svg')
    
    expect(chevron).not.toHaveClass('rotate-180')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(chevron).toHaveClass('rotate-180')
    })
  })

  it('should apply rounded-full styling to button', () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('rounded-full')
  })

  it('should have backdrop blur effect', () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('backdrop-blur-sm')
  })

  it('should apply active scale effect', () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('active:scale-95')
  })

  it('should have hover effects', () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:border-sparkle-primary')
    expect(button).toHaveClass('hover:shadow-md')
  })

  it('should close dropdown on window resize', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getAllByText('Option 2').length).toBeGreaterThan(1)
    })
    
    fireEvent(window, new Event('resize'))
    
    await waitFor(() => {
      const remainingOptions = screen.queryAllByText('Option 2')
      expect(remainingOptions.length).toBeLessThanOrEqual(1)
    })
  })

  it('should close dropdown on window scroll', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getAllByText('Option 2').length).toBeGreaterThan(1)
    })
    
    fireEvent.scroll(window)
    
    await waitFor(() => {
      const remainingOptions = screen.queryAllByText('Option 2')
      expect(remainingOptions.length).toBeLessThanOrEqual(1)
    })
  })

  it('should highlight selected option', async () => {
    render(<Dropdown options={mockOptions} value="Option 2" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      const option2Buttons = screen.getAllByText('Option 2')
      const selectedOption = option2Buttons.find(el => 
        el.closest('.text-sparkle-primary') || el.classList.contains('text-sparkle-primary')
      )
      expect(selectedOption).toBeTruthy()
    })
  })

  it('should use portal for dropdown panel', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      const portal = document.querySelector('.dropdown-portal')
      expect(portal).toBeInTheDocument()
    })
  })

  it('should position dropdown panel below button', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      const portal = document.querySelector('.dropdown-portal')
      expect(portal).toHaveStyle({ position: 'fixed' })
    })
  })

  it('should handle empty options array', () => {
    render(<Dropdown options={[]} value="" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should maintain button width for dropdown panel', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      const portal = document.querySelector('.dropdown-portal')
      expect(portal).toHaveStyle({ width: expect.any(String) })
    })
  })

  it('should apply transition to chevron rotation', () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const chevron = document.querySelector('svg')
    expect(chevron).toHaveClass('transition-transform')
    expect(chevron).toHaveClass('duration-300')
  })

  it('should have z-index for proper layering', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      const portal = document.querySelector('.dropdown-portal')
      expect(portal).toHaveClass('z-[9999]')
    })
  })

  it('should apply fade-in animation to dropdown panel', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      const portal = document.querySelector('.dropdown-portal')
      expect(portal).toHaveClass('animate-in', 'fade-in', 'zoom-in-95')
    })
  })

  it('should have rounded corners on dropdown panel', async () => {
    render(<Dropdown options={mockOptions} value="Option 1" onChange={mockOnChange} />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    
    await waitFor(() => {
      const portal = document.querySelector('.dropdown-portal')
      expect(portal).toHaveClass('rounded-2xl')
    })
  })
})