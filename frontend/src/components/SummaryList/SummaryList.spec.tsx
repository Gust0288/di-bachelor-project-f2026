import { render, screen } from '@testing-library/react'
import SummaryList from './SummaryList'

describe('SummaryList', () => {
  it('renders default and plain variants', () => {
    const items = [
      { label: 'Navn', value: 'DI' },
      { label: 'Status', value: <strong key="ok">OK</strong> },
    ]

    const { rerender } = render(
      <SummaryList items={items} className="extra" />,
    )

    expect(screen.getByText('Navn')).toBeInTheDocument()
    expect(screen.getByText('OK')).toBeInTheDocument()
    expect(screen.getByText('Navn').closest('dl')).toHaveClass(
      'summaryList',
      'extra',
    )

    rerender(<SummaryList items={items} variant="plain" />)

    expect(screen.getByText('Navn').closest('dl')).toHaveClass(
      'summaryList--plain',
    )
  })
})
