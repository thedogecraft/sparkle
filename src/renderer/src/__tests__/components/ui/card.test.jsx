import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Card from '../../../components/ui/card'

describe('Card Component', () => {
  it('should render without crashing', () => {
    render(<Card>Test Content</Card>)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render children correctly', () => {
    render(
      <Card>
        <div data-testid="child">Child Element</div>
      </Card>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should apply default styling classes', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('bg-sparkle-card')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('border-sparkle-border/50')
    expect(card).toHaveClass('rounded-3xl')
  })

  it('should merge custom className with default classes', () => {
    render(<Card className="custom-class">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('custom-class')
    expect(card).toHaveClass('bg-sparkle-card')
  })

  it('should apply hover effects', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('hover:border-sparkle-primary/50')
    expect(card).toHaveClass('hover:shadow-lg')
    expect(card).toHaveClass('hover:-translate-y-1')
  })

  it('should have transition effects', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('transition-all')
    expect(card).toHaveClass('duration-300')
    expect(card).toHaveClass('ease-out')
  })

  it('should apply group class for child animations', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('group')
  })

  it('should apply backdrop blur', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('backdrop-blur-sm')
  })

  it('should spread additional props to the div', () => {
    render(<Card data-testid="card-test" aria-label="Test Card">Content</Card>)
    const card = screen.getByTestId('card-test')
    expect(card).toHaveAttribute('aria-label', 'Test Card')
  })

  it('should handle id prop', () => {
    render(<Card id="my-card">Content</Card>)
    const card = document.getElementById('my-card')
    expect(card).toBeInTheDocument()
  })

  it('should handle onClick event', () => {
    const handleClick = vi.fn()
    render(<Card onClick={handleClick}>Content</Card>)
    const card = screen.getByText('Content').parentElement
    fireEvent.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render multiple children', () => {
    render(
      <Card>
        <h1>Title</h1>
        <p>Description</p>
        <button>Action</button>
      </Card>
    )
    expect(screen.getByRole('heading')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle nested components', () => {
    render(
      <Card>
        <Card>Nested Card</Card>
      </Card>
    )
    expect(screen.getByText('Nested Card')).toBeInTheDocument()
  })

  it('should preserve className order for CSS specificity', () => {
    render(<Card className="z-50 bg-red-500">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card.className).toContain('z-50')
    expect(card.className).toContain('bg-red-500')
  })

  it('should render with empty children', () => {
    render(<Card></Card>)
    const card = document.querySelector('.bg-sparkle-card')
    expect(card).toBeInTheDocument()
  })

  it('should handle style prop', () => {
    render(<Card style={{ padding: '20px' }}>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveStyle({ padding: '20px' })
  })

  it('should handle data attributes', () => {
    render(<Card data-category="ui" data-version="1.0">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveAttribute('data-category', 'ui')
    expect(card).toHaveAttribute('data-version', '1.0')
  })

  it('should apply rounded-3xl for consistent corner radius', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('rounded-3xl')
  })

  it('should allow overriding border color via className', () => {
    render(<Card className="border-red-500">Content</Card>)
    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('border-red-500')
  })
})