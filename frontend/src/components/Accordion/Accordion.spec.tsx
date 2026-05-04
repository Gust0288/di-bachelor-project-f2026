import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Accordion from './Accordion'

describe('Accordion', () => {
  const items = [
    {
      id: 'first',
      title: 'Første spørgsmål',
      content: <p>Første svar</p>,
    },
    {
      id: 'second',
      title: 'Andet spørgsmål',
      content: <strong>Andet svar</strong>,
    },
  ]

  it('renders items and custom className', () => {
    render(<Accordion items={items} className="extra" />)

    expect(screen.getByText('Første spørgsmål').closest('div')).toHaveClass(
      'accordion',
      'extra',
    )
    expect(screen.getByText('Første svar')).toBeInTheDocument()
    expect(screen.getByText('Andet svar')).toBeInTheDocument()
  })

  it('toggles an item when the summary is clicked', async () => {
    const user = userEvent.setup()
    render(<Accordion items={items} />)

    const firstDetails = screen.getByText('Første spørgsmål').closest('details')

    expect(firstDetails).not.toHaveAttribute('open')

    await user.click(screen.getByText('Første spørgsmål'))

    expect(firstDetails).toHaveAttribute('open')
  })
})
