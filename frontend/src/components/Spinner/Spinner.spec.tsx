import { render, screen } from '@testing-library/react'
import Spinner from './Spinner'

describe('Spinner', () => {
  it('renders every variant, size, display, and class branch', () => {
    render(
      <>
        <Spinner aria-label="default" />
        <Spinner aria-label="primary" variant="theme-primary" />
        <Spinner aria-label="secondary" variant="theme-secondary" />
        <Spinner aria-label="white" variant="white" />
        <Spinner aria-label="black" variant="black" />
        <Spinner aria-label="small" size="small" />
        <Spinner aria-label="large" size="large" />
        <Spinner aria-label="xlarge" size="xlarge" display="full" className="extra" />
      </>,
    )

    expect(screen.getByRole('status', { name: 'primary' })).toHaveClass(
      'spinner--theme-primary',
    )
    expect(screen.getByRole('status', { name: 'secondary' })).toHaveClass(
      'spinner--theme-secondary',
    )
    expect(screen.getByRole('status', { name: 'white' })).toHaveClass(
      'spinner--white',
    )
    expect(screen.getByRole('status', { name: 'black' })).toHaveClass(
      'spinner--black',
    )
    expect(screen.getByRole('status', { name: 'small' })).toHaveClass(
      'spinner--sm',
    )
    expect(screen.getByRole('status', { name: 'large' })).toHaveClass(
      'spinner--lg',
    )
    expect(screen.getByRole('status', { name: 'xlarge' })).toHaveClass(
      'spinner--xl',
      'spinner--full',
      'extra',
    )
  })
})
