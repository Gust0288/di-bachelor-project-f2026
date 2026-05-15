import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WizardPage from './WizardPage'
import {
  confirmEmailVerification,
  createSession,
  getBranchSuggestions,
  getFlow,
  getSession,
  saveStep,
  sendEmailVerification,
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
  getBranchSuggestions: jest.fn(),
}))

jest.mock('../../api/cvr', () => ({
  lookupByName: jest.fn(),
  lookupByVat: jest.fn(),
}))

const mockedCreateSession = jest.mocked(createSession)
const mockedGetFlow = jest.mocked(getFlow)
const mockedGetSession = jest.mocked(getSession)
const mockedSaveStep = jest.mocked(saveStep)
const mockedSendEmailVerification = jest.mocked(sendEmailVerification)
const mockedConfirmEmailVerification = jest.mocked(confirmEmailVerification)
const mockedSubmitRegistration = jest.mocked(submitRegistration)
const mockedGetBranchSuggestions = jest.mocked(getBranchSuggestions)

const completeStepData = {
  '1': {
    cvr_number: '12345678',
    company_name: 'Test A/S',
    company_type: 'Aktieselskab',
    address: 'Testvej 1',
    zip_code: '1000',
    city: 'København K',
    industry_code: '620100',
    industry_description: 'Computerprogrammering',
    contact_name: 'Test Person',
    contact_job_title: 'Direktør',
    contact_email: 'test@example.com',
    contact_phone: '12345678',
    website: 'https://example.com',
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
  '6': { branchefaellesskaber: ['di-digital'] },
  '7': {
    computed_membership: 'Arbejdsgiver',
    membership_type: 'Arbejdsgiver',
    accept_membership: true,
  },
  '8': {
    managing_director: {
      name: 'Direktør Test',
      title: 'CEO',
      email: 'ceo@example.com',
      phone: '12345678',
    },
    hr_contact: null,
    payroll_contact: null,
    authorized_signatory: null,
    invoice_delivery: 'email',
  },
  '9': { accept_terms: true, accept_authority: true },
}

function renderWizardAtStep(currentStep: number) {
  window.history.pushState({}, '', `/wizard?session=session-${currentStep}`)

  mockedGetFlow.mockResolvedValue({
    version: '1.0',
    total_steps: 11,
    steps: [],
  })
  mockedCreateSession.mockResolvedValue({
    session_id: `session-${currentStep}`,
    current_step: 1,
    expires_at: '2026-05-18T10:00:00Z',
  })
  mockedGetSession.mockResolvedValue({
    session_id: `session-${currentStep}`,
    current_step: currentStep,
    tier: 'smv',
    flags: { non_ovk: true },
    status: 'draft',
    expires_at: '2026-05-18T10:00:00Z',
    updated_at: '',
    email_verified: true,
    step_data: currentStep === 1 ? {} : completeStepData,
  })
  mockedSaveStep.mockResolvedValue({
    session_id: `session-${currentStep}`,
    current_step: currentStep + 1,
    tier: 'smv',
    flags: { non_ovk: true },
    is_blocked: false,
    blocking_popup: null,
    next_step: currentStep + 1,
  })
  mockedSendEmailVerification.mockResolvedValue({ email: 'test@example.com' })
  mockedConfirmEmailVerification.mockResolvedValue({ verified: true })
  mockedSubmitRegistration.mockResolvedValue({
    registration_id: 'registration-1',
    session_id: `session-${currentStep}`,
    status: 'submitted',
  })
  mockedGetBranchSuggestions.mockResolvedValue({
    mandatory: ['di-digital'],
    suggested: ['di-produktion'],
    all: [
      { id: 'di-digital', name: 'DI Digital' },
      { id: 'di-produktion', name: 'DI Produktion' },
      { id: 'di-byggeri', name: 'DI Byggeri' },
    ],
  })

  return render(
    <MemoryRouter initialEntries={[`/wizard?session=session-${currentStep}`]}>
      <WizardPage />
    </MemoryRouter>,
  )
}

describe('WizardPage step content', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    {
      currentStep: 1,
      title: 'Indmeldelse i Dansk Industri',
      expectedTexts: ['Kontaktperson', 'CVR / Virksomhedsnavn', 'Virksomhedens hjemmeside'],
    },
    {
      currentStep: 2,
      title: 'Hvad laver din virksomhed?',
      expectedTexts: ['Oplysninger hentet fra CVR', 'Test A/S', '620100 - Computerprogrammering'],
    },
    {
      currentStep: 3,
      title: 'Ønsker og behov',
      expectedTexts: ['Overenskomst', 'Byggegaranti', 'Andet'],
    },
    {
      currentStep: 4,
      title: 'Virksomhedens ansatte',
      expectedTexts: ['Antal ansatte', 'Medarbejdertyper', 'Samlet lønsum'],
    },
    {
      currentStep: 5,
      title: 'Overenskomst',
      expectedTexts: ['Har virksomheden en overenskomst?', 'Nej', 'Ved ikke', 'Ja'],
    },
    {
      currentStep: 6,
      title: 'Fællesskaber og foreninger',
      expectedTexts: ['Obligatorisk fællesskab', 'DI Digital', 'DI Produktion'],
    },
    {
      currentStep: 7,
      title: 'Jeres medlemskab',
      expectedTexts: ['Arbejdsgiver', 'Virksomhedsstørrelse', 'Jeg bekræfter den anbefalede medlemskabstype'],
    },
    {
      currentStep: 8,
      title: 'Kontaktpersoner',
      expectedTexts: ['Administrerende direktør', 'Primær kontaktperson for personalejura', 'Faktura'],
    },
    {
      currentStep: 9,
      title: 'Godkendelse',
      expectedTexts: ['Virksomhed', 'Kontakt og behov', 'Acceptér og bekræft'],
    },
    {
      currentStep: 10,
      title: 'MitID verificering',
      expectedTexts: ['Godkend indmeldelsen', 'Fortsæt til MitID'],
    },
  ])('renders the expected content for step $currentStep', async ({ currentStep, title, expectedTexts }) => {
    renderWizardAtStep(currentStep)

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { name: title }).length).toBeGreaterThan(0)
    })

    for (const text of expectedTexts) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0)
    }
  })
})
