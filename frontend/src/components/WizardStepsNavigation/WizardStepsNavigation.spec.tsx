import { render, screen } from '@testing-library/react'
import WizardStepsNavigation from './WizardStepsNavigation'

describe('WizardStepsNavigation', () => {
  it('renders steps with statuses and vertical orientation', () => {
    render(
      <WizardStepsNavigation
        ariaLabel="Flow"
        orientation="vertical"
        className="extra"
        steps={[
          { label: 'Start', status: 'complete' },
          { label: 'Nu', status: 'current' },
          { label: 'Senere' },
        ]}
      />,
    )

    expect(screen.getByRole('navigation', { name: 'Flow' })).toBeInTheDocument()
    expect(screen.getByText('Start').closest('li')).toHaveClass('is-complete')
    expect(screen.getByText('Nu').closest('li')).toHaveClass('is-current')
    expect(screen.getByText('Nu').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(screen.getByText('Senere').closest('ol')).toHaveAttribute(
      'data-orientation',
      'vertical',
    )
  })

  it('uses default navigation label and horizontal orientation', () => {
    render(<WizardStepsNavigation steps={[{ label: 'Start' }]} />)

    expect(
      screen.getByRole('navigation', { name: 'Wizard navigation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Start').closest('ol')).toHaveAttribute(
      'data-orientation',
      'horizontal',
    )
  })
})
