import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../../../components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(<Button>Test Button</Button>)
      expect(screen.getByText('Test Button')).toBeInTheDocument()
    })

    it('should render with complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('should apply primary variant by default', () => {
      render(<Button>Primary</Button>)
      const button = screen.getByText('Primary')
      expect(button).toHaveClass('bg-sparkle-primary')
    })

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByText('Secondary')
      expect(button).toHaveClass('bg-sparkle-card')
    })

    it('should apply outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByText('Outline')
      expect(button).toHaveClass('border-sparkle-primary')
    })

    it('should apply danger variant', () => {
      render(<Button variant="danger">Danger</Button>)
      const button = screen.getByText('Danger')
      expect(button).toHaveClass('bg-red-600')
    })
  })

  describe('Sizes', () => {
    it('should apply small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByText('Small')
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('should apply medium size by default', () => {
      render(<Button>Medium</Button>)
      const button = screen.getByText('Medium')
      expect(button).toHaveClass('px-3', 'py-1.5')
    })

    it('should apply large size', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByText('Large')
      expect(button).toHaveClass('px-5', 'py-3', 'text-lg')
    })
  })

  describe('Disabled State', () => {
    it('should apply disabled styles when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByText('Disabled')
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('should not trigger onClick when disabled', async () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      const button = screen.getByText('Disabled')
      
      await userEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should have disabled attribute when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByText('Disabled')
      expect(button).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByText('Click me')
      
      await userEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple clicks', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByText('Click me')
      
      await userEvent.click(button)
      await userEvent.click(button)
      await userEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(3)
    })

    it('should pass event to onClick handler', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByText('Click me')
      
      await userEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
    })
  })

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByText('Button')
      expect(button).toHaveClass('custom-class')
    })

    it('should merge custom className with default classes', () => {
      render(<Button className="my-custom-class">Button</Button>)
      const button = screen.getByText('Button')
      expect(button).toHaveClass('my-custom-class')
      expect(button).toHaveClass('bg-sparkle-primary')
    })
  })

  describe('As Prop', () => {
    it('should render as button by default', () => {
      render(<Button>Button</Button>)
      const button = screen.getByText('Button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('should render as different element when specified', () => {
      render(<Button as="a">Link Button</Button>)
      const button = screen.getByText('Link Button')
      expect(button.tagName).toBe('A')
    })
  })

  describe('Additional Props', () => {
    it('should spread additional props', () => {
      render(<Button data-testid="custom-button">Button</Button>)
      expect(screen.getByTestId('custom-button')).toBeInTheDocument()
    })

    it('should handle type prop', () => {
      render(<Button type="submit">Submit</Button>)
      const button = screen.getByText('Submit')
      expect(button).toHaveAttribute('type', 'submit')
    })

    it('should handle aria attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>)
      const button = screen.getByLabelText('Custom label')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have base styles', () => {
      render(<Button>Button</Button>)
      const button = screen.getByText('Button')
      expect(button).toHaveClass('flex', 'items-center', 'rounded-xl')
    })

    it('should have transition styles', () => {
      render(<Button>Button</Button>)
      const button = screen.getByText('Button')
      expect(button).toHaveClass('transition-all', 'duration-200')
    })

    it('should have focus styles', () => {
      render(<Button>Button</Button>)
      const button = screen.getByText('Button')
      expect(button).toHaveClass('focus-visible:ring-2')
    })

    it('should have active scale effect', () => {
      render(<Button>Button</Button>)
      const button = screen.getByText('Button')
      expect(button).toHaveClass('active:scale-90')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should handle null children', () => {
      render(<Button>{null}</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should handle rapid clicks', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Button</Button>)
      const button = screen.getByText('Button')
      
      for (let i = 0; i < 10; i++) {
        await userEvent.click(button)
      }
      
      expect(handleClick).toHaveBeenCalledTimes(10)
    })
  })

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Button</Button>)
      const button = screen.getByText('Button')
      
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should support keyboard activation', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Button</Button>)
      const button = screen.getByText('Button')
      
      button.focus()
      await userEvent.keyboard('{Enter}')
      
      expect(handleClick).toHaveBeenCalled()
    })
  })
})