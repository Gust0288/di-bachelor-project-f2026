import { render, screen } from '@testing-library/react'
import Header from './Header'

describe('Header', () => {
  it('renders portal logo link', () => {
    render(<Header />)

    expect(
      screen.getByRole('link', { name: 'Indmeldelsesportal' }),
    ).toHaveAttribute('href', '/')
  })
})
