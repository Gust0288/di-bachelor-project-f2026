import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RadioCardGroup from './RadioCardGroup'

describe('RadioCardGroup', () => {
  it('renders options, description, and handles selection', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()

    render(
      <RadioCardGroup
        label="Vælg svar"
        description="Kun et svar"
        className="extra"
        options={[
          { value: 'yes', title: 'Ja', description: 'Det passer' },
          { value: 'no', title: 'Nej' },
        ]}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('radiogroup', { name: 'Vælg svar' })).toHaveClass(
      'radioCardGroup',
      'extra',
    )
    expect(screen.getByText('Kun et svar')).toBeInTheDocument()
    expect(screen.getByText('Det passer')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Nej/ }))

    expect(onChange).toHaveBeenCalledWith('no')
  })

  it('renders without group description or option descriptions', () => {
    render(
      <RadioCardGroup
        label="Svar"
        options={[{ value: 'yes', title: 'Ja' }]}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Ja' })).toBeInTheDocument()
  })
})
