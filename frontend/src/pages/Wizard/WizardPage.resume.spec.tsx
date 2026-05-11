import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import WizardPage from './WizardPage'
import {
  getFlow,
  getSession,
  saveStep,
  sendEmailVerification,
  confirmEmailVerification,
  submitRegistration,
} from '../../api/registration'

jest.mock('../../api/registration', () => ({
  getFlow: jest.fn(),
  getSession: jest.fn(),
  createSession: jest.fn(),
  saveStep: jest.fn(),
  sendEmailVerification: jest.fn(),
  confirmEmailVerification: jest.fn(),
  submitRegistration: jest.fn(),
  uploadDocument: jest.fn(),
}))

const mockedGetFlow = jest.mocked(getFlow)
const mockedGetSession = jest.mocked(getSession)
const mockedSaveStep = jest.mocked(saveStep)
const mockedSendEmailVerification = jest.mocked(sendEmailVerification)
const mockedConfirmEmailVerification = jest.mocked(confirmEmailVerification)
const mockedSubmitRegistration = jest.mocked(submitRegistration)

function renderResumedWizard() {
  window.history.pushState({}, '', '/wizard?session=session-1')

  mockedGetFlow.mockResolvedValue({
    version: '1.0',
    total_steps: 11,
    steps: [],
  })
  mockedGetSession.mockResolvedValue({
    session_id: 'session-1',
    current_step: 8,
    tier: 'smv',
    flags: { non_ovk: true },
    status: 'draft',
    expires_at: '2026-05-11T12:00:00Z',
    updated_at: '',
    email_verified: true,
    step_data: {
      '1': {
        cvr_number: '12345678',
        company_name: 'Test A/S',
        contact_name: 'Test Person',
        contact_job_title: 'Direktør',
        contact_email: 'test@example.com',
        contact_phone: '12345678',
      },
      '2': { cvr_confirmed: true },
      '3': { selected_services: ['overenskomst'] },
      '4': {
        employee_count: 25,
        no_employees: false,
        employee_types: ['funktionaer'],
        total_loensum: 10000000,
      },
      '5': { overenskomst_status: 'nej' },
      '6': { branchefaellesskaber: ['di-produktion'] },
      '7': {
        computed_membership: 'Arbejdsgiver',
        membership_type: 'Arbejdsgiver',
        accept_membership: true,
      },
    },
  })
  mockedSaveStep.mockResolvedValue({
    session_id: 'session-1',
    current_step: 9,
    tier: 'smv',
    flags: { non_ovk: true },
    is_blocked: false,
    blocking_popup: null,
    next_step: 9,
  })
  mockedSendEmailVerification.mockResolvedValue({ email: 'test@example.com' })
  mockedConfirmEmailVerification.mockResolvedValue({ verified: true })
  mockedSubmitRegistration.mockResolvedValue({
    registration_id: 'registration-1',
    session_id: 'session-1',
    status: 'submitted',
  })

  return render(
    <MemoryRouter initialEntries={['/wizard?session=session-1']}>
      <WizardPage />
    </MemoryRouter>,
  )
}

describe('WizardPage resumed flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps rendering when changing invoice delivery in a resumed flow', async () => {
    const user = userEvent.setup()

    renderResumedWizard()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Kontaktpersoner' })).toBeInTheDocument()
    })

    const emailRadio = screen.getByRole('radio', { name: 'På e-mail' })
    await user.click(emailRadio)
    expect(emailRadio).toBeChecked()

    const bsRadio = screen.getByRole('radio', { name: /Via Betalingsservice/ })
    await user.click(bsRadio)
    expect(bsRadio).toBeChecked()
  })
})
