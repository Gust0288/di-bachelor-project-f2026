import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import WizardSummary from './WizardSummary'

type Props = ComponentProps<typeof WizardSummary>

const emptyContact = () => ({ name: '', email: '', phone: '', title: '' })

const baseProps: Props = {
  currentStepIndex: 0,
  formData: {
    contactName: '',
    contactJobTitle: '',
    contactEmail: '',
    contactPhone: '',
    companyId: '',
    website: '',
    branchCodesCorrect: '',
  },
  selectedCompany: undefined,
  cvrData: null,
  selectedServices: [],
  andetBeskrivelse: '',
  employeeCount: '',
  noEmployees: false,
  employeeTypes: [],
  totalLoensum: '',
  overenskomstStatus: '',
  overenskomstType: '',
  documentId: '',
  selectedFaellesskaber: [],
  allFaellesskaber: [],
  computedMembership: undefined,
  managingDirector: emptyContact(),
  hrContact: null,
  payrollContact: null,
  authorizedSignatory: null,
  invoiceDelivery: '',
}

function renderSummary(overrides: Partial<Props> = {}) {
  return render(<WizardSummary {...baseProps} {...overrides} />)
}

describe('WizardSummary', () => {
  it('renders only the requested fields in the requested order', () => {
    const { container } = renderSummary({
      formData: {
        contactName: 'Test Person',
        contactJobTitle: 'Direktør',
        contactEmail: 'test@example.com',
        contactPhone: '12345678',
        companyId: '12345678',
        website: 'https://example.com',
        branchCodesCorrect: '',
      },
      selectedCompany: {
        id: '12345678',
        label: 'Test A/S',
        branchCodes: [{ code: '620100', title: 'Computerprogrammering' }],
      },
      selectedServices: ['overenskomst', 'andet'],
      andetBeskrivelse: 'International rådgivning',
      employeeCount: 25,
      employeeTypes: ['funktionaer'],
      totalLoensum: 10000000,
      overenskomstStatus: 'ja',
      overenskomstType: 'direkte',
      documentId: 'document-1',
      selectedFaellesskaber: ['di-digital'],
      allFaellesskaber: [{ id: 'di-digital', name: 'DI Digital' }],
      computedMembership: 'Arbejdsgiver',
      managingDirector: {
        name: 'Direktør Test',
        title: 'CEO',
        email: 'ceo@example.com',
        phone: '12345678',
      },
      invoiceDelivery: 'email',
    })

    const labels = [...container.querySelectorAll('dt')].map((item) => item.textContent)

    expect(labels).toEqual([
      'Virksomhedens navn',
      'Primær branche',
      'Kontaktperson',
      'Medlemstype',
      'Antal ansatte',
      'Estimeret pris',
    ])
    expect(screen.getByText('Test A/S')).toBeInTheDocument()
    expect(screen.getByText('620100 Computerprogrammering')).toBeInTheDocument()
    expect(screen.getByText('Test Person (Direktør, test@example.com, 12345678)')).toBeInTheDocument()
    expect(screen.getByText('Arbejdsgiver')).toBeInTheDocument()
    expect(screen.getByText('25 ansatte')).toBeInTheDocument()
    expect(screen.getByText(/Samlet lønsum:/)).toBeInTheDocument()
    expect(screen.getByText('DI-kontingent')).toBeInTheDocument()
    expect(screen.getByText('Fællesskaber og foreninger')).toBeInTheDocument()
    expect(screen.getByText('Estimeret pr. år')).toBeInTheDocument()

    expect(screen.queryByText('Valgte services')).not.toBeInTheDocument()
    expect(screen.queryByText('Administrerende direktør')).not.toBeInTheDocument()
  })

  it('uses CVR data as branch fallback when resumed company has no branch codes', () => {
    renderSummary({
      selectedCompany: {
        id: '12345678',
        label: 'Test A/S',
        branchCodes: [],
      },
      cvrData: {
        cvr_number: '12345678',
        company_name: 'Test A/S',
        company_type: 'Aktieselskab',
        address: 'Testvej 1',
        zip_code: '1000',
        city: 'København K',
        industry_code: '620100',
        industry_description: 'Computerprogrammering',
      },
    })

    expect(screen.getByText('620100 Computerprogrammering')).toBeInTheDocument()
  })
})
