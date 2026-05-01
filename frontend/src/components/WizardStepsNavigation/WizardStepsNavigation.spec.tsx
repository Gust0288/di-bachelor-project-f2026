import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WizardStepsNavigation } from './WizardStepsNavigation'

describe('WizardStepsNavigation', () => {
  it('renders step states with the default horizontal orientation', () => {
    render(
      <WizardStepsNavigation
        steps={[
          { label: 'Completed', status: 'complete' },
          { label: 'Current', status: 'current' },
          { label: 'Upcoming', status: 'upcoming' },
          { label: 'Default' },
        ]}
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'Wizard navigation' })
    const list = within(nav).getByRole('list')
    const steps = within(list).getAllByRole('listitem')

    expect(list).toHaveAttribute('data-orientation', 'horizontal')
    expect(steps[0]).toHaveClass('is-complete')
    expect(steps[0]).not.toHaveAttribute('aria-current')
    expect(steps[0].querySelector('svg')).toBeInTheDocument()
    expect(steps[1]).toHaveClass('is-current')
    expect(steps[1]).toHaveAttribute('aria-current', 'step')
    expect(within(steps[1]).getByText('2')).toBeInTheDocument()
    expect(steps[2]).not.toHaveClass('is-current')
    expect(steps[2]).not.toHaveClass('is-complete')
    expect(within(steps[2]).getByText('3')).toBeInTheDocument()
    expect(within(steps[3]).getByText('4')).toBeInTheDocument()
  })

  it('supports a custom label, className, and vertical orientation', () => {
    render(
      <WizardStepsNavigation
        ariaLabel="Indmeldelsesflow"
        className="custom-navigation"
        orientation="vertical"
        steps={[{ label: 'Company' }]}
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'Indmeldelsesflow' })
    const list = within(nav).getByRole('list')

    expect(list).toHaveAttribute('data-orientation', 'vertical')
    expect(list).toHaveClass('wizardStepsNavigation')
    expect(list).toHaveClass('custom-navigation')
  })

  it('calls onStepSelect for enabled steps and disables unavailable steps', async () => {
    const user = userEvent.setup()
    const handleStepSelect = jest.fn()

    render(
      <WizardStepsNavigation
        onStepSelect={handleStepSelect}
        steps={[
          { label: 'Company', status: 'complete' },
          { label: 'Branch', status: 'current' },
          { label: 'Employees', isDisabled: true },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Gå til Company' }))
    await user.click(screen.getByRole('button', { name: 'Gå til Branch' }))

    expect(
      screen.getByRole('button', { name: 'Gå til Employees' }),
    ).toBeDisabled()
    expect(handleStepSelect).toHaveBeenNthCalledWith(1, 0)
    expect(handleStepSelect).toHaveBeenNthCalledWith(2, 1)
    expect(handleStepSelect).toHaveBeenCalledTimes(2)
  })
})
