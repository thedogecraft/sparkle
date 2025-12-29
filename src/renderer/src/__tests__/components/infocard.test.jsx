import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import InfoCard from '../../components/infocard'
import { Cpu, HardDrive } from 'lucide-react'

describe('InfoCard Component', () => {
  const defaultProps = {
    icon: Cpu,
    iconBgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    items: [
      { label: 'Label 1', value: 'Value 1' },
      { label: 'Label 2', value: 'Value 2' }
    ]
  }

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<InfoCard {...defaultProps} />)
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('should render title correctly', () => {
      render(<InfoCard {...defaultProps} />)
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('should render subtitle when provided', () => {
      render(<InfoCard {...defaultProps} />)
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
    })

    it('should not render subtitle when not provided', () => {
      const propsWithoutSubtitle = { ...defaultProps, subtitle: undefined }
      render(<InfoCard {...propsWithoutSubtitle} />)
      expect(screen.queryByText('Test Subtitle')).not.toBeInTheDocument()
    })

    it('should render icon', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render all items', () => {
      render(<InfoCard {...defaultProps} />)
      expect(screen.getByText('Label 1')).toBeInTheDocument()
      expect(screen.getByText('Value 1')).toBeInTheDocument()
      expect(screen.getByText('Label 2')).toBeInTheDocument()
      expect(screen.getByText('Value 2')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply icon background color class', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      const iconContainer = container.querySelector('.bg-blue-500\\/10')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should apply icon color class', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      const icon = container.querySelector('.text-blue-500')
      expect(icon).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <InfoCard {...defaultProps} className="custom-class" />
      )
      const card = container.firstChild
      expect(card).toHaveClass('custom-class')
    })

    it('should have Card component styling', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      const card = container.firstChild
      expect(card).toHaveClass('bg-sparkle-card')
    })

    it('should have proper title styling', () => {
      render(<InfoCard {...defaultProps} />)
      const title = screen.getByText('Test Title')
      expect(title).toHaveClass('text-lg', 'font-semibold')
    })

    it('should have proper subtitle styling', () => {
      render(<InfoCard {...defaultProps} />)
      const subtitle = screen.getByText('Test Subtitle')
      expect(subtitle).toHaveClass('text-sparkle-text-secondary', 'text-sm')
    })
  })

  describe('Items Rendering', () => {
    it('should render empty items array', () => {
      const propsWithoutItems = { ...defaultProps, items: [] }
      render(<InfoCard {...propsWithoutItems} />)
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('should render single item', () => {
      const singleItem = {
        ...defaultProps,
        items: [{ label: 'Single Label', value: 'Single Value' }]
      }
      render(<InfoCard {...singleItem} />)
      expect(screen.getByText('Single Label')).toBeInTheDocument()
      expect(screen.getByText('Single Value')).toBeInTheDocument()
    })

    it('should render many items', () => {
      const manyItems = {
        ...defaultProps,
        items: Array.from({ length: 10 }, (_, i) => ({
          label: `Label ${i}`,
          value: `Value ${i}`
        }))
      }
      render(<InfoCard {...manyItems} />)
      
      for (let i = 0; i < 10; i++) {
        expect(screen.getByText(`Label ${i}`)).toBeInTheDocument()
        expect(screen.getByText(`Value ${i}`)).toBeInTheDocument()
      }
    })

    it('should apply correct styling to item labels', () => {
      render(<InfoCard {...defaultProps} />)
      const label = screen.getByText('Label 1')
      expect(label).toHaveClass('text-sparkle-text-secondary', 'text-xs')
    })

    it('should apply correct styling to item values', () => {
      render(<InfoCard {...defaultProps} />)
      const value = screen.getByText('Value 1')
      expect(value).toHaveClass('text-sparkle-text', 'font-medium')
    })
  })

  describe('Different Icon Types', () => {
    it('should render different icon components', () => {
      const { container: container1 } = render(
        <InfoCard {...defaultProps} icon={Cpu} />
      )
      const { container: container2 } = render(
        <InfoCard {...defaultProps} icon={HardDrive} />
      )
      
      expect(container1.querySelector('svg')).toBeInTheDocument()
      expect(container2.querySelector('svg')).toBeInTheDocument()
    })

    it('should apply correct size to icon', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('width', '24')
      expect(icon).toHaveAttribute('height', '24')
    })
  })

  describe('Props Spreading', () => {
    it('should spread additional props to Card component', () => {
      render(<InfoCard {...defaultProps} data-testid="info-card" />)
      expect(screen.getByTestId('info-card')).toBeInTheDocument()
    })

    it('should handle onClick prop', () => {
      const handleClick = vi.fn()
      render(<InfoCard {...defaultProps} onClick={handleClick} />)
      
      const card = screen.getByText('Test Title').closest('div')?.parentElement
      if (card) {
        card.click()
        expect(handleClick).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle long title text', () => {
      const longTitle = 'A'.repeat(100)
      render(<InfoCard {...defaultProps} title={longTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle long subtitle text', () => {
      const longSubtitle = 'B'.repeat(100)
      render(<InfoCard {...defaultProps} subtitle={longSubtitle} />)
      expect(screen.getByText(longSubtitle)).toBeInTheDocument()
    })

    it('should handle special characters in text', () => {
      const specialChars = 'Test!@#$%^&*()'
      render(<InfoCard {...defaultProps} title={specialChars} />)
      expect(screen.getByText(specialChars)).toBeInTheDocument()
    })

    it('should handle unicode characters', () => {
      const unicode = '测试 👋 🚀'
      render(<InfoCard {...defaultProps} title={unicode} />)
      expect(screen.getByText(unicode)).toBeInTheDocument()
    })

    it('should handle empty string values', () => {
      const emptyValues = {
        ...defaultProps,
        title: '',
        subtitle: '',
        items: [{ label: '', value: '' }]
      }
      render(<InfoCard {...emptyValues} />)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    it('should handle null subtitle gracefully', () => {
      const propsWithNull = { ...defaultProps, subtitle: null }
      render(<InfoCard {...propsWithNull} />)
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('should have flex layout for icon and text', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      const headerContainer = container.querySelector('.flex.items-start.gap-3')
      expect(headerContainer).toBeInTheDocument()
    })

    it('should have proper spacing between items', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      const itemsContainer = container.querySelector('.space-y-3')
      expect(itemsContainer).toBeInTheDocument()
    })

    it('should have rounded icon container', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      const iconContainer = container.querySelector('.rounded-lg')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<InfoCard {...defaultProps} />)
      const heading = screen.getByRole('heading')
      expect(heading.tagName).toBe('H2')
    })

    it('should maintain readable text contrast', () => {
      render(<InfoCard {...defaultProps} />)
      const title = screen.getByText('Test Title')
      expect(title).toHaveClass('text-sparkle-text')
    })

    it('should have semantic HTML structure', () => {
      const { container } = render(<InfoCard {...defaultProps} />)
      expect(container.querySelector('h2')).toBeInTheDocument()
      expect(container.querySelector('p')).toBeInTheDocument()
    })
  })
})