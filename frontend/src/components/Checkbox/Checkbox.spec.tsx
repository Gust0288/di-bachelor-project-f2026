import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Checkbox from './Checkbox'

describe('Checkbox', () => {
  it('renders label, description, error, custom class, and toggles', async () => {
    const user = userEvent.setup()
    render(
      <Checkbox
        className="extra"
        description="Du accepterer betingelserne"
        errorMessage="Skal accepteres"
      >
        Accepter
      </Checkbox>,
    )

    const checkbox = screen.getByRole('checkbox', { name: /Accepter/ })
    expect(screen.getByText('Accepter').closest('label')).toHaveClass(
      'checkbox',
      'extra',
    )
    expect(screen.getByText('Du accepterer betingelserne')).toBeInTheDocument()
    await user.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('renders without optional copy and supports indeterminate state', () => {
    render(<Checkbox isIndeterminate />)

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })
})
