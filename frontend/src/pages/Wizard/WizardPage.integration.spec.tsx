import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import WizardPage from './WizardPage'
import {
  confirmEmailVerification,
  confirmEmailVerificationGlobal,
  createSession,
  getBranchSuggestions,
  getFlow,
  getSession,
  saveStep,
  sendEmailVerification,
  sendEmailVerificationGlobal,
  submitRegistration,
} from '../../api/registration'
import { lookupByVat } from '../../api/cvr'

jest.mock('../../api/registration', () => ({
  getFlow: jest.fn(),
  getSession: jest.fn(),
  createSession: jest.fn(),
  saveStep: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendEmailVerificationGlobal: jest.fn(),
  confirmEmailVerification: jest.fn(),
  confirmEmailVerificationGlobal: jest.fn(),
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
const mockedSendEmailVerificationGlobal = jest.mocked(sendEmailVerificationGlobal)
const mockedConfirmEmailVerification = jest.mocked(confirmEmailVerification)
const mockedConfirmEmailVerificationGlobal = jest.mocked(confirmEmailVerificationGlobal)
const mockedSubmitRegistration = jest.mocked(submitRegistration)
const mockedGetBranchSuggestions = jest.mocked(getBranchSuggestions)
const mockedLookupByVat = jest.mocked(lookupByVat)

const sessionStepData = {
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

function setupDefaultMocks() {
  mockedGetFlow.mockResolvedValue({
    version: '1.0',
    total_steps: 11,
    steps: [],
  })
  mockedCreateSession.mockResolvedValue({
    session_id: 'new-session',
    current_step: 1,
    expires_at: '2026-05-18T10:00:00Z',
  })
  mockedSaveStep.mockResolvedValue({
    session_id: 'new-session',
    current_step: 2,
    tier: 'smv',
    flags: {},
    is_blocked: false,
    blocking_popup: null,
    next_step: 2,
  })
  mockedSendEmailVerification.mockResolvedValue({ email: 'test@example.com' })
  mockedSendEmailVerificationGlobal.mockResolvedValue({ email: 'test@example.com' })
  mockedConfirmEmailVerification.mockResolvedValue({ verified: true })
  mockedConfirmEmailVerificationGlobal.mockResolvedValue({ session_id: 'new-session', current_step: 1 })
  mockedSubmitRegistration.mockResolvedValue({
    registration_id: 'registration-1',
    session_id: 'new-session',
    status: 'submitted',
  })
  mockedLookupByVat.mockResolvedValue({
    cvr: 12345678,
    navn: 'Test A/S',
    virksomhedsform: 'Aktieselskab',
    adresse: 'Testvej 1',
    postnummer: '1000',
    by: 'København K',
    branchekode: 620100,
    branchetekst: 'Computerprogrammering',
  })
  mockedGetBranchSuggestions.mockResolvedValue({
    mandatory: ['di-digital'],
    suggested: ['di-produktion'],
    all: [
      { id: 'di-digital', name: 'DI Digital' },
      { id: 'di-produktion', name: 'DI Produktion' },
    ],
  })
}

function renderNewWizard() {
  window.history.pushState({}, '', '/wizard')
  return render(
    <MemoryRouter initialEntries={['/wizard']}>
      <WizardPage />
    </MemoryRouter>,
  )
}

function renderResumedWizard(
  currentStep = 8,
  stepData: Record<string, Record<string, unknown>> = sessionStepData,
) {
  window.history.pushState({}, '', `/wizard?session=session-${currentStep}`)

  mockedGetSession.mockResolvedValue({
    session_id: `session-${currentStep}`,
    current_step: currentStep,
    tier: 'smv',
    flags: { non_ovk: true },
    status: 'draft',
    expires_at: '2026-05-18T10:00:00Z',
    updated_at: '',
    email_verified: true,
    step_data: stepData,
  })

  return render(
    <MemoryRouter initialEntries={[`/wizard?session=session-${currentStep}`]}>
      <WizardPage />
    </MemoryRouter>,
  )
}

async function waitForWizardStart() {
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Indmeldelse i Dansk Industri' })).toBeInTheDocument()
  })
}

async function fillStepOne(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: 'Navn' }), 'Test Person')
  await user.type(screen.getByRole('textbox', { name: 'Stillingsbetegnelse' }), 'Direktør')
  await user.type(screen.getByRole('textbox', { name: 'Email' }), 'test@example.com')
  await user.type(screen.getByRole('textbox', { name: 'Telefonnummer' }), '12345678')

  await user.type(screen.getByRole('textbox', { name: /CVR \/ Virksomhedsnavn/ }), '12345678')
  await user.click(await screen.findByText('Test A/S'))
}

describe('WizardPage integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
    setupDefaultMocks()
  })

  it('starter wizard-flowet, henter CVR-data og navigerer til næste step efter email-bekræftelse', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    renderNewWizard()
    await waitForWizardStart()
    await fillStepOne(user)

    await user.click(screen.getByRole('button', { name: 'Fortsæt' }))

    await waitFor(() => {
      expect(mockedLookupByVat).toHaveBeenCalledWith('12345678')
      expect(mockedSendEmailVerificationGlobal).toHaveBeenCalledWith(
        expect.objectContaining({
          cvr_number: '12345678',
          contact_email: 'test@example.com',
          company_name: 'Test A/S',
        }),
      )
    })
    expect(await screen.findByRole('heading', { name: 'Bekræft din e-mail' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Tal 1 af 6'), '123456')

    await waitFor(() => {
      expect(mockedConfirmEmailVerificationGlobal).toHaveBeenCalledWith('test@example.com', '123456')
    })

    expect(await screen.findByText('E-mail bekræftet')).toBeInTheDocument()

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.queryByText('E-mail bekræftet')).not.toBeInTheDocument()
    })
    expect(await screen.findByRole('heading', { name: 'Hvad laver din virksomhed?' })).toBeInTheDocument()
    jest.useRealTimers()
  })

  it('bevarer indtastet data når brugeren går frem og tilbage mellem steps', async () => {
    const user = userEvent.setup()

    renderResumedWizard(2)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hvad laver din virksomhed?' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Tilbage' }))

    expect(await screen.findByRole('heading', { name: 'Indmeldelse i Dansk Industri' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Navn' })).toHaveValue('Test Person')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('test@example.com')
    expect(screen.getByRole('textbox', { name: /CVR \/ Virksomhedsnavn/ })).toHaveValue('Test A/S (CVR: 12345678)')

    await user.click(screen.getByRole('button', { name: /Gå til Branche/ }))
    expect(await screen.findByRole('heading', { name: 'Hvad laver din virksomhed?' })).toBeInTheDocument()
  })

  it('viser valideringsfejl og blokerer navigation ved ugyldigt input', async () => {
    const user = userEvent.setup()

    renderNewWizard()
    await waitForWizardStart()

    await user.click(screen.getByRole('button', { name: 'Fortsæt' }))

    expect(screen.getAllByText('Udfyld kontaktpersonens navn for at fortsætte.')).not.toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Indmeldelse i Dansk Industri' })).toBeInTheDocument()
    expect(mockedSaveStep).not.toHaveBeenCalled()
  })

  it('viser trin 2-validering ved checkboxen og scroller dertil ved gentagne forsøg', async () => {
    const user = userEvent.setup()
    const scrollIntoView = jest.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView

    renderResumedWizard(2, {
      ...sessionStepData,
      '2': { cvr_confirmed: false },
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Hvad laver din virksomhed?' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Fortsæt' }))

    const message = 'Bekræft virksomhedsoplysningerne for at fortsætte.'
    await waitFor(() => {
      expect(screen.getAllByText(message).length).toBeGreaterThan(1)
      expect(scrollIntoView).toHaveBeenCalled()
    })

    const firstCallCount = scrollIntoView.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Fortsæt' }))

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledTimes(firstCallCount + 1)
    })
  })

  it('springer irrelevante steps over når backend returnerer et senere next_step', async () => {
    const user = userEvent.setup()
    mockedSaveStep.mockResolvedValueOnce({
      session_id: 'session-4',
      current_step: 6,
      tier: 'mikro',
      flags: {},
      is_blocked: false,
      blocking_popup: null,
      next_step: 6,
    })

    renderResumedWizard(4)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Virksomhedens ansatte' })).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText('Virksomheden har ingen ansatte (0 ansatte)'))
    await user.clear(screen.getByRole('spinbutton', { name: /Samlet lønsum/ }))
    await user.type(screen.getByRole('spinbutton', { name: /Samlet lønsum/ }), '0')
    await user.click(screen.getByRole('button', { name: 'Fortsæt' }))

    expect(await screen.findByRole('heading', { name: 'Fællesskaber og foreninger' })).toBeInTheDocument()
    expect(mockedSaveStep).toHaveBeenCalledWith(
      'session-4',
      4,
      expect.objectContaining({
        no_employees: true,
        employee_count: 0,
      }),
    )
  })

  it('kan genoptage en eksisterende session på korrekt step med tidligere data', async () => {
    renderResumedWizard(8)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Kontaktpersoner' })).toBeInTheDocument()
    })

    expect(screen.getByRole('textbox', { name: 'Fulde navn' })).toHaveValue('Direktør Test')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('ceo@example.com')
    expect(mockedGetSession).toHaveBeenCalled()
  })

  it('viser korrekt medlemstype på godkendelse ved anden arbejdsgiverorganisation', async () => {
    renderResumedWizard(9, {
      ...sessionStepData,
      '3': { selected_services: [] },
      '5': { overenskomst_status: 'ja', overenskomst_type: 'anden' },
      '6': { branchefaellesskaber: [] },
      '7': {
        computed_membership: 'Associeret',
        membership_type: 'Associeret',
        accept_membership: true,
      },
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Opsummering og godkendelse' })).toBeInTheDocument()
    })

    expect(screen.getAllByText('Associeret').length).toBeGreaterThan(0)
    expect(screen.queryByText('Arbejdsgiver')).not.toBeInTheDocument()
  })
})
