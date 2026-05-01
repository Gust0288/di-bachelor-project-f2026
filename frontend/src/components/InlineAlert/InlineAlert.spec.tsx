import { render, screen } from '@testing-library/react'
import InlineAlert from './InlineAlert'

describe('InlineAlert', () => {
  it('renders default info status with title and class', () => {
    render(
      <InlineAlert title="Info" className="extra">
        Besked
      </InlineAlert>,
    )

    const alert = screen.getByRole('status')
    expect(alert).toHaveAttribute('data-tone', 'info')
    expect(alert).toHaveClass('inlineAlert', 'extra')
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('renders danger as alert without title', () => {
    render(<InlineAlert tone="danger">Fejl</InlineAlert>)

    expect(screen.getByRole('alert')).toHaveAttribute('data-tone', 'danger')
    expect(screen.queryByText('Info')).not.toBeInTheDocument()
  })
})
