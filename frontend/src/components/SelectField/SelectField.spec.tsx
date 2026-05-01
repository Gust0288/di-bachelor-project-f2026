import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectField from './SelectField'

describe('SelectField', () => {
  it('renders description, opens options, and handles selection', async () => {
    const onSelectionChange = jest.fn()
    const user = userEvent.setup()

    const { container } = render(
      <SelectField
        label="Virksomhed"
        description="Vælg en virksomhed"
        className="extra"
        options={[
          { id: '1', label: 'DI A/S', description: 'CVR 1' },
          { id: '2', label: 'DI ApS' },
        ]}
        onSelectionChange={onSelectionChange}
      />,
    )

    expect(screen.getByText('Vælg en virksomhed')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveClass('selectField__button')
    expect(container.querySelector('.selectField')).toHaveClass(
      'selectField',
      'extra',
    )

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('option', { name: /DI A\/S/ }))

    expect(screen.getByText('CVR 1')).toBeInTheDocument()
    expect(onSelectionChange).toHaveBeenCalledWith('1')
  })

  it('renders without optional description fields', async () => {
    const user = userEvent.setup()

    render(
      <SelectField
        label="Virksomhed"
        options={[{ id: '1', label: 'DI A/S' }]}
      />,
    )

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('option', { name: /DI A\/S/ })).toBeInTheDocument()
  })
})
