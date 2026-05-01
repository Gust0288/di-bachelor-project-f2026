import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InputField from './InputField'

describe('InputField', () => {
  it('renders input field props and updates value', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()

    render(
      <InputField
        label="Email"
        description="Brug arbejdsmail"
        className="field-extra"
        inputClassName="input-extra"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="navn@example.dk"
        onChange={onChange}
      />,
    )

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('inputmode', 'email')
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAttribute('placeholder', 'navn@example.dk')
    expect(input).toHaveClass('inputField__input', 'input-extra')
    expect(screen.getByText('Brug arbejdsmail')).toBeInTheDocument()

    await user.type(input, 'a')

    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('renders without description and custom classes', () => {
    render(<InputField label="Navn" />)

    expect(screen.getByLabelText('Navn')).toBeInTheDocument()
  })
})
