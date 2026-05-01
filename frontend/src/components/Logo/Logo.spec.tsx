import { render, screen } from '@testing-library/react'
import Logo from './Logo'

describe('Logo', () => {
  it('renders with title text and accessible label', () => {
    render(<Logo href="/" title="Portal" />)

    const link = screen.getByRole('link', { name: 'Portal' })
    expect(link).toHaveAttribute('href', '/')
    expect(screen.getByText('Portal')).toBeInTheDocument()
  })

  it('uses default accessible label without visible title', () => {
    render(<Logo href="/di" />)

    expect(screen.getByRole('link', { name: 'DI' })).toHaveAttribute(
      'href',
      '/di',
    )
  })
})
