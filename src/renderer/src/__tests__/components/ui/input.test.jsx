import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input, LargeInput } from '../../../components/ui/input'

describe('Input Component', () => {
  it('should render without crashing', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('should apply default type as text', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('should accept custom type', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('should display placeholder text', () => {
    render(<Input placeholder="Enter your name" />)
    const input = screen.getByPlaceholderText('Enter your name')
    expect(input).toBeInTheDocument()
  })

  it('should handle defaultValue', () => {
    render(<Input defaultValue="Initial Value" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Initial Value')
  })

  it('should call onChange handler when value changes', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    
    fireEvent.change(input, { target: { value: 'New Value' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('should apply default styling classes', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('w-full')
    expect(input).toHaveClass('bg-sparkle-card/50')
    expect(input).toHaveClass('backdrop-blur-sm')
    expect(input).toHaveClass('border')
    expect(input).toHaveClass('border-sparkle-border')
    expect(input).toHaveClass('rounded-full')
  })

  it('should merge custom className with defaults', () => {
    render(<Input className="custom-class" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
    expect(input).toHaveClass('w-full')
  })

  it('should apply focus ring styles', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('focus:ring-2')
    expect(input).toHaveClass('focus:ring-sparkle-primary/20')
    expect(input).toHaveClass('focus:border-sparkle-primary')
  })

  it('should spread additional props', () => {
    render(<Input data-testid="test-input" aria-label="Test Input" />)
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('aria-label', 'Test Input')
  })

  it('should handle disabled state', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should handle required attribute', () => {
    render(<Input required />)
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('should handle maxLength attribute', () => {
    render(<Input maxLength={10} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('maxLength', '10')
  })

  it('should apply rounded-full for pill shape', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('rounded-full')
  })

  it('should have proper padding', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('px-5', 'py-2.5')
  })

  it('should have transition effects', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('transition-all')
  })
})

describe('LargeInput Component', () => {
  const TestIcon = () => <svg data-testid="test-icon">Icon</svg>

  it('should render without crashing', () => {
    render(<LargeInput />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('should render with icon when provided', () => {
    render(<LargeInput icon={TestIcon} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should not render icon when not provided', () => {
    render(<LargeInput />)
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
  })

  it('should display placeholder text', () => {
    render(<LargeInput placeholder="Search..." />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('should handle value prop', () => {
    render(<LargeInput value="Current Value" onChange={() => {}} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Current Value')
  })

  it('should call onChange handler', () => {
    const handleChange = vi.fn()
    render(<LargeInput onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    
    fireEvent.change(input, { target: { value: 'Test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('should apply container styling', () => {
    render(<LargeInput />)
    const container = document.querySelector('.flex.items-center')
    expect(container).toHaveClass('bg-sparkle-card/50')
    expect(container).toHaveClass('border')
    expect(container).toHaveClass('rounded-full')
    expect(container).toHaveClass('backdrop-blur-md')
  })

  it('should apply focus-within styles to container', () => {
    render(<LargeInput />)
    const container = document.querySelector('.flex.items-center')
    expect(container).toHaveClass('focus-within:border-sparkle-primary')
    expect(container).toHaveClass('focus-within:ring-2')
    expect(container).toHaveClass('focus-within:ring-sparkle-primary/20')
  })

  it('should merge custom className with container', () => {
    render(<LargeInput className="custom-container" />)
    const container = document.querySelector('.custom-container')
    expect(container).toBeInTheDocument()
  })

  it('should style input to fill container', () => {
    render(<LargeInput />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('flex-1')
  })

  it('should remove input borders and background', () => {
    render(<LargeInput />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-none')
    expect(input).toHaveClass('bg-transparent')
  })

  it('should remove focus outline from input', () => {
    render(<LargeInput />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('focus:ring-0')
    expect(input).toHaveClass('focus:outline-hidden')
  })

  it('should have gap between icon and input', () => {
    render(<LargeInput icon={TestIcon} />)
    const container = document.querySelector('.gap-3')
    expect(container).toBeInTheDocument()
  })

  it('should style icon with secondary color', () => {
    render(<LargeInput icon={TestIcon} />)
    const iconContainer = screen.getByTestId('test-icon').parentElement
    expect(iconContainer).toHaveClass('text-sparkle-text-secondary')
  })

  it('should have consistent padding in container', () => {
    render(<LargeInput />)
    const container = document.querySelector('.px-6')
    expect(container).toBeInTheDocument()
  })

  it('should spread additional props to input', () => {
    render(<LargeInput data-testid="large-input" aria-label="Large Input" />)
    const input = screen.getByTestId('large-input')
    expect(input).toHaveAttribute('aria-label', 'Large Input')
  })

  it('should handle disabled state', () => {
    render(<LargeInput disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should apply transition effects to container', () => {
    render(<LargeInput />)
    const container = document.querySelector('.transition-all')
    expect(container).toBeInTheDocument()
  })

  it('should render icon with correct size', () => {
    render(<LargeInput icon={TestIcon} />)
    const iconContainer = screen.getByTestId('test-icon').parentElement
    expect(iconContainer).toHaveClass('w-5', 'h-5')
  })

  it('should handle controlled input updates', () => {
    const { rerender } = render(<LargeInput value="Value 1" onChange={() => {}} />)
    let input = screen.getByRole('textbox')
    expect(input).toHaveValue('Value 1')
    
    rerender(<LargeInput value="Value 2" onChange={() => {}} />)
    input = screen.getByRole('textbox')
    expect(input).toHaveValue('Value 2')
  })

  it('should apply backdrop blur to container', () => {
    render(<LargeInput />)
    const container = document.querySelector('.backdrop-blur-md')
    expect(container).toBeInTheDocument()
  })
})