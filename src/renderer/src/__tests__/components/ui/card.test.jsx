import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from '../../../components/ui/Card'

describe('Card Component', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<Card>Content</Card>)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(<Card>Test Content</Card>)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render complex children', () => {
      render(
        <Card>
          <h2>Title</h2>
          <p>Description</p>
        </Card>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply base card styles', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('bg-sparkle-card')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('rounded-3xl')
    })

    it('should apply custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('custom-class')
    })

    it('should merge custom className with default classes', () => {
      const { container } = render(<Card className="p-8">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('p-8')
      expect(card).toHaveClass('bg-sparkle-card')
    })

    it('should have hover effects', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('hover:border-sparkle-primary/50')
      expect(card).toHaveClass('hover:shadow-lg')
      expect(card).toHaveClass('hover:-translate-y-1')
    })

    it('should have transition effects', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('transition-all')
      expect(card).toHaveClass('duration-300')
    })

    it('should have backdrop blur effect', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('backdrop-blur-sm')
    })
  })

  describe('Props Spreading', () => {
    it('should spread additional props', () => {
      render(<Card data-testid="custom-card">Content</Card>)
      expect(screen.getByTestId('custom-card')).toBeInTheDocument()
    })

    it('should handle onClick prop', () => {
      const handleClick = vi.fn()
      const { container } = render(<Card onClick={handleClick}>Content</Card>)
      const card = container.firstChild
      
      card?.click()
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle id prop', () => {
      const { container } = render(<Card id="my-card">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveAttribute('id', 'my-card')
    })

    it('should handle role prop', () => {
      const { container } = render(<Card role="article">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveAttribute('role', 'article')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<Card></Card>)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle null children', () => {
      const { container } = render(<Card>{null}</Card>)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(1000)
      render(<Card>{longContent}</Card>)
      expect(screen.getByText(longContent)).toBeInTheDocument()
    })

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()'
      render(<Card>{specialChars}</Card>)
      expect(screen.getByText(specialChars)).toBeInTheDocument()
    })

    it('should handle unicode characters', () => {
      const unicode = '测试 👋 🚀'
      render(<Card>{unicode}</Card>)
      expect(screen.getByText(unicode)).toBeInTheDocument()
    })
  })

  describe('Nested Components', () => {
    it('should render nested cards', () => {
      render(
        <Card>
          <Card>Nested Card</Card>
        </Card>
      )
      expect(screen.getByText('Nested Card')).toBeInTheDocument()
    })

    it('should maintain styling with nested content', () => {
      const { container } = render(
        <Card className="p-4">
          <div className="flex gap-2">
            <span>Item 1</span>
            <span>Item 2</span>
          </div>
        </Card>
      )
      const card = container.firstChild
      expect(card).toHaveClass('p-4')
      expect(card).toHaveClass('bg-sparkle-card')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with proper content', () => {
      render(<Card><h2>Accessible Card</h2></Card>)
      const heading = screen.getByText('Accessible Card')
      expect(heading.tagName).toBe('H2')
    })

    it('should support aria attributes', () => {
      const { container } = render(
        <Card aria-label="Custom label" aria-describedby="desc">
          Content
        </Card>
      )
      const card = container.firstChild
      expect(card).toHaveAttribute('aria-label', 'Custom label')
      expect(card).toHaveAttribute('aria-describedby', 'desc')
    })
  })
})