import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  it('renders default button and handles press', async () => {
    const onPress = jest.fn()
    const user = userEvent.setup()

    render(<Button onPress={onPress}>Gem</Button>)

    await user.click(screen.getByRole('button', { name: 'Gem' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('applies every variant and size branch', () => {
    const variants = [
      'light',
      'remarkable',
      'outline',
      'secondary',
      'outline light',
      'styleless',
      'quiet',
      'danger',
      'default',
      'primary',
    ] as const

    const sizes = ['small', 'sm', 'lg', 'md'] as const

    render(
      <>
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        {sizes.map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
      </>,
    )

    expect(screen.getByRole('button', { name: 'danger' })).toHaveClass(
      'button--danger',
    )
    expect(screen.getByRole('button', { name: 'small' })).toHaveClass(
      'button--small',
    )
    expect(screen.getByRole('button', { name: 'lg' })).toHaveClass(
      'button--large',
    )
  })

  it('renders disabled and spinning states', () => {
    render(
      <Button
        className="extra"
        isDisabled
        isSpinning
        spinnerAriaLabel="Arbejder"
      >
        Send
      </Button>,
    )

    const button = screen.getByRole('button', { name: /Send/ })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('button', 'is-disabled', 'is-spinning', 'extra')
    expect(screen.getByRole('status', { name: 'Arbejder' })).toBeInTheDocument()
  })
})
