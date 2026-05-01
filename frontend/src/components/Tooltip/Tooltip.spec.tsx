import { render, screen } from '@testing-library/react'
import Tooltip from './Tooltip'

describe('Tooltip', () => {
  it('renders default remarkable tooltip trigger', () => {
    render(<Tooltip content="Hjaelp">?</Tooltip>)

    expect(
      screen.getByRole('button', { name: 'Vis hjælpetekst' }),
    ).toHaveClass('tooltip__trigger')
  })

  it('supports custom label, placement, class, and default variant branch', () => {
    const { container } = render(
      <Tooltip
        content="Mere hjaelp"
        label="Aabn hjaelp"
        placement="bottom"
        variant="default"
        className="extra"
      >
        i
      </Tooltip>,
    )

    expect(
      screen.getByRole('button', { name: 'Aabn hjaelp' }),
    ).toBeInTheDocument()
    expect(container.firstElementChild).toHaveTextContent('i')
  })
})
