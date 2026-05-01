import { render, screen } from '@testing-library/react'
import FieldGroup from './FieldGroup'

describe('FieldGroup', () => {
  it('renders required and optional content', () => {
    render(
      <FieldGroup title="Felter" description="Vigtige felter" className="extra">
        Indhold
      </FieldGroup>,
    )

    expect(screen.getByRole('heading', { name: 'Felter' })).toBeInTheDocument()
    expect(screen.getByText('Vigtige felter')).toBeInTheDocument()
    expect(screen.getByText('Indhold').closest('section')).toHaveClass(
      'fieldGroup',
      'extra',
    )
  })

  it('renders without description', () => {
    render(<FieldGroup title="Felter">Indhold</FieldGroup>)

    expect(screen.queryByText('Vigtige felter')).not.toBeInTheDocument()
  })
})
