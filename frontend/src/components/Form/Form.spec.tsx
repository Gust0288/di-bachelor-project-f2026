import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextField } from 'react-aria-components'
import {
  Description,
  FieldButton,
  FieldError,
  Form,
  Label,
} from './Form'

describe('Form helpers', () => {
  const nonStringClassName = (() => 'ignored') as unknown as string

  it('renders form and field helpers with custom classes', async () => {
    const onSubmit = jest.fn((event) => event.preventDefault())
    const user = userEvent.setup()

    render(
      <Form className="form-extra" onSubmit={onSubmit}>
        <Label className="label-extra">Navn</Label>
        <Description className="description-extra">Hjælpetekst</Description>
        <TextField isInvalid>
          <FieldError className="error-extra">Fejl</FieldError>
        </TextField>
        <FieldButton className="button-extra" type="submit">
          Gem
        </FieldButton>
      </Form>,
    )

    expect(screen.getByText('Navn')).toHaveClass('form__label', 'label-extra')
    expect(screen.getByText('Hjælpetekst')).toHaveClass(
      'form__description',
      'description-extra',
    )
    expect(screen.getByText('Fejl')).toHaveClass('form__error', 'error-extra')
    expect(screen.getByRole('button', { name: 'Gem' })).toHaveClass(
      'form__button',
      'button-extra',
    )

    await user.click(screen.getByRole('button', { name: 'Gem' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('ignores non-string className functions', () => {
    render(
      <Form className={nonStringClassName}>
        <Label className={nonStringClassName}>Label</Label>
        <TextField isInvalid>
          <FieldError className={nonStringClassName}>Error</FieldError>
        </TextField>
        <Description className={nonStringClassName}>Description</Description>
        <FieldButton className={nonStringClassName}>Button</FieldButton>
      </Form>,
    )

    expect(screen.getByText('Label')).toHaveClass('form__label')
    expect(screen.getByText('Error')).toHaveClass('form__error')
    expect(screen.getByText('Description')).toHaveClass('form__description')
    expect(screen.getByRole('button', { name: 'Button' })).toHaveClass(
      'form__button',
    )
  })
})
