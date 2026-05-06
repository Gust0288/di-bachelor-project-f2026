import { render, screen } from '@testing-library/react'
import ContentBox from './ContentBox'

describe('ContentBox', () => {
  it('renders title, description, children, and custom class', () => {
    render(
      <ContentBox title="Titel" description="Beskrivelse" className="extra">
        Indhold
      </ContentBox>,
    )

    expect(screen.getByRole('heading', { name: 'Titel' })).toBeInTheDocument()
    expect(screen.getByText('Beskrivelse')).toBeInTheDocument()
    expect(screen.getByText('Indhold').closest('section')).toHaveClass(
      'contentBox',
      'extra',
    )
  })

  it('renders without optional header content', () => {
    render(<ContentBox>Kun indhold</ContentBox>)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('Kun indhold')).toBeInTheDocument()
  })

  it('renders title-only and description-only header branches', () => {
    const { rerender } = render(<ContentBox title="Kun titel">Indhold</ContentBox>)

    expect(screen.getByRole('heading', { name: 'Kun titel' })).toBeInTheDocument()

    rerender(<ContentBox description="Kun beskrivelse">Indhold</ContentBox>)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('Kun beskrivelse')).toBeInTheDocument()
  })

  it('renders action element', () => {
    render(
      <ContentBox title="Titel" action={<button>Handlinger</button>}>
        Indhold
      </ContentBox>,
    )

    expect(screen.getByRole('button', { name: 'Handlinger' })).toBeInTheDocument()
  })
})
