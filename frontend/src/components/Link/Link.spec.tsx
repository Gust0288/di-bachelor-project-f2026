import { render, screen } from '@testing-library/react'
import Link from './Link'

describe('Link', () => {
  it('marks external links', () => {
    render(
      <Link href="https://example.com" className="extra">
        Ekstern
      </Link>,
    )

    const link = screen.getByRole('link', { name: 'Ekstern' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveClass('link', 'extra')
  })

  it('leaves internal and missing href links untouched', () => {
    render(
      <>
        <Link href="/intern">Intern</Link>
        <Link>Ingen href</Link>
      </>,
    )

    expect(screen.getByRole('link', { name: 'Intern' })).not.toHaveAttribute(
      'target',
    )
    expect(screen.getByText('Ingen href')).not.toHaveAttribute('target')
  })
})
