import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WizardPage from './WizardPage'

describe('WizardPage', () => {
  it('renders the first wizard step and the summary shell', () => {
    render(<WizardPage />)

    expect(
      screen.getByRole('heading', { name: 'Indmeldelse i Dansk Industri' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Indmeldelsesflow' }))
      .toBeInTheDocument()
    expect(screen.getByText('Opsummering af dine valg')).toBeInTheDocument()
    expect(screen.getByLabelText('Navn')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /CVR \/ Virksomhedsnavn/ }),
    ).toBeInTheDocument()
  })

  it('updates the sticky summary from entered contact data', async () => {
    const user = userEvent.setup()
    render(<WizardPage />)

    await user.type(screen.getByLabelText('Navn'), 'Ada Lovelace')

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
  })

  it('moves between the implemented steps', () => {
    const { container } = render(<WizardPage />)
    const form = container.querySelector('form')

    expect(form).not.toBeNull()

    fireEvent.submit(form as HTMLFormElement)

    expect(
      screen.getByRole('heading', { name: 'Hvad laver din virksomhed?' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Oplysninger hentet fra CVR')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tilbage' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }))

    expect(
      screen.getByRole('heading', { name: 'Indmeldelse i Dansk Industri' }),
    ).toBeInTheDocument()
  })
})
