import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextAreaField from './TextAreaField'

describe('TextAreaField', () => {
  it('renders field props and updates value', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()

    render(
      <TextAreaField
        label="Kommentar"
        description="Skriv kort"
        className="extra"
        placeholder="Din kommentar"
        rows={6}
        onChange={onChange}
      />,
    )

    const textarea = screen.getByLabelText('Kommentar')
    expect(textarea).toHaveAttribute('placeholder', 'Din kommentar')
    expect(textarea).toHaveAttribute('rows', '6')
    expect(screen.getByText('Skriv kort')).toBeInTheDocument()

    await user.type(textarea, 'Hej')

    expect(onChange).toHaveBeenLastCalledWith('Hej')
  })

  it('uses default rows and no description', () => {
    render(<TextAreaField label="Kommentar" />)

    expect(screen.getByLabelText('Kommentar')).toHaveAttribute('rows', '4')
  })
})
