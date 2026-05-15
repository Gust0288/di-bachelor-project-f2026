import { render, screen } from '@testing-library/react'
import ApprovalStep from './09ApprovalStep'

describe('ApprovalStep', () => {
  it('summarizes all wizard sections before approval', () => {
    render(
      <ApprovalStep
        formData={{
          contactName: 'Test Person',
          contactJobTitle: 'Direktør',
          contactEmail: 'test@example.com',
          contactPhone: '12345678',
          companyId: '12345678',
          website: 'https://example.com',
          branchCodesCorrect: '',
        }}
        selectedCompany={{
          id: '12345678',
          label: 'Test A/S',
          branchCodes: [],
        }}
        cvrData={{
          cvr_number: '12345678',
          company_name: 'Test A/S',
          company_type: 'Aktieselskab',
          address: 'Testvej 1',
          zip_code: '1000',
          city: 'København K',
          industry_code: '620100',
          industry_description: 'Computerprogrammering',
        }}
        selectedServices={['overenskomst', 'andet']}
        andetBeskrivelse="Særligt behov"
        employeeCount={25}
        noEmployees={false}
        employeeTypes={['funktionaer']}
        totalLoensum={10000000}
        overenskomstStatus="ja"
        overenskomstType="direkte"
        documentId="document-1"
        selectedFaellesskaber={['di-digital']}
        allFaellesskaber={[{ id: 'di-digital', name: 'DI Digital' }]}
        computedMembership="Arbejdsgiver"
        managingDirector={{
          name: 'Direktør Test',
          title: 'CEO',
          email: 'ceo@example.com',
          phone: '12345678',
        }}
        hrContact={{
          name: 'HR Test',
          title: 'HR',
          email: 'hr@example.com',
          phone: '',
        }}
        payrollContact={null}
        authorizedSignatory={null}
        invoiceDelivery="email"
        acceptTerms={false}
        onAcceptTermsChange={jest.fn()}
        acceptAuthority={false}
        onAcceptAuthorityChange={jest.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Medlemskaber' })).toBeInTheDocument()
    expect(screen.getByText('Totallønsum')).toBeInTheDocument()
    expect(screen.getByText('Branchefællesskaber')).toBeInTheDocument()
    expect(screen.getByText('DI Digital')).toBeInTheDocument()
    expect(screen.getByText('På e-mail')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Aftaler' })).toBeInTheDocument()
    expect(screen.getByText('Overenskomst, Andet: Særligt behov')).toBeInTheDocument()
    expect(screen.getByText('Direkte med et fagforbund')).toBeInTheDocument()
    expect(screen.getByText('Uploadet dokument')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Virksomhedsinformation' })).toBeInTheDocument()
    expect(screen.getByText('Aktieselskab')).toBeInTheDocument()
    expect(screen.getByText('620100 Computerprogrammering')).toBeInTheDocument()
    expect(screen.getByText('Test Person (Direktør, test@example.com, 12345678)')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Adresser' })).toBeInTheDocument()
    expect(screen.getByText('Data fra CVR-registret')).toBeInTheDocument()
    expect(screen.getByText('Testvej 1')).toBeInTheDocument()
    expect(screen.getByText('1000 København K')).toBeInTheDocument()

    expect(screen.getByText('25 ansatte')).toBeInTheDocument()
    expect(screen.getByText(/10\.000\.000/)).toBeInTheDocument()
    expect(screen.getByText('Arbejdsgiver')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Dit DI medlemskab' })).toBeInTheDocument()
    expect(screen.getByText('DI-kontingent')).toBeInTheDocument()
    expect(screen.getByText('Estimeret pr. år')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Ledelse' })).toBeInTheDocument()
    expect(screen.getByText('Direktør Test (CEO, ceo@example.com, 12345678)')).toBeInTheDocument()
    expect(screen.getByText('HR Test (HR, hr@example.com)')).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: /Rediger/ })).not.toBeInTheDocument()

    const sectionHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(sectionHeadings[sectionHeadings.length - 1]).toHaveTextContent('Acceptér og bekræft')
  })
})
