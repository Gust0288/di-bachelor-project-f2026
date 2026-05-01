import { render, screen } from '@testing-library/react'
import Confirm, { ConfirmContent, ConfirmFooter } from './Confirm'

describe('Confirm', () => {
  it('renders modal headline, content, footer, and classes', () => {
    render(
      <Confirm headline="Slet emne" className="modal-extra" isOpen>
        <ConfirmContent className="content-extra">Er du sikker?</ConfirmContent>
        <ConfirmFooter className="footer-extra">Handlinger</ConfirmFooter>
      </Confirm>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Slet emne' })).toBeInTheDocument()
    expect(screen.getByText('Er du sikker?')).toHaveClass(
      'confirmContent',
      'content-extra',
    )
    expect(screen.getByText('Handlinger')).toHaveClass(
      'confirmFooter',
      'footer-extra',
    )
    expect(screen.getByRole('dialog').parentElement).toHaveClass(
      'modal',
      'modal-extra',
    )
  })

  it('uses default dismissable behavior', () => {
    render(
      <Confirm headline="Bekræft" isOpen>
        Indhold
      </Confirm>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
