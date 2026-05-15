import type { ReactNode } from 'react'
import Checkbox from '../../../components/Checkbox/Checkbox'
import {
  EMPLOYEE_TYPE_LABELS,
  OVERENSKOMST_STATUS_LABELS,
  SERVICE_LABELS,
} from '../wizard.constants'
import {
  calculateMembershipPriceEstimate,
  formatDkk,
  type MembershipPriceEstimate,
} from '../membershipPrice'
import type { ContactPerson } from './ContactPersonFields'
import type { CvrHiddenFields } from '../types'
import type { CompanyOption, WizardFormData } from '../wizard.types'
import styles from '../WizardPage.module.scss'

const DI_TERMS_URL = 'https://www.danskindustri.dk/om-di/almindelige-betingelser/'
const DI_PRIVACY_URL = 'https://www.danskindustri.dk/om-di/privatlivspolitik/'

type ApprovalStepProps = {
  formData: WizardFormData
  selectedCompany?: CompanyOption
  cvrData: CvrHiddenFields | null
  selectedServices: string[]
  andetBeskrivelse: string
  employeeCount: number | ''
  noEmployees: boolean
  employeeTypes: string[]
  totalLoensum: number | ''
  overenskomstStatus: string
  overenskomstType: string
  documentId: string
  selectedFaellesskaber: string[]
  allFaellesskaber: { id: string; name: string }[]
  computedMembership: string | undefined
  managingDirector: ContactPerson
  hrContact: ContactPerson | null
  payrollContact: ContactPerson | null
  authorizedSignatory: ContactPerson | null
  invoiceDelivery: string
  acceptTerms: boolean
  onAcceptTermsChange: (value: boolean) => void
  acceptAuthority: boolean
  onAcceptAuthorityChange: (value: boolean) => void
  invalidField?: string
  validationMessage?: string
}

type ReviewItem = {
  label: string
  value: ReactNode
  isWide?: boolean
}

const invoiceLabels: Record<string, string> = {
  email: 'På e-mail',
  betalingsservice: 'Via Betalingsservice (BS)',
}

const agreementTypeLabels: Record<string, string> = {
  direkte: 'Direkte med et fagforbund',
  anden: 'Med en anden arbejdsgiverorganisation',
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(', ') : 'Ikke angivet'
}

function formatContact(person: ContactPerson | null): string {
  if (!person) return 'Ikke angivet'

  const name = person.name.trim()
  const details = [person.title, person.email, person.phone]
    .map((value) => value.trim())
    .filter(Boolean)

  if (!name && details.length === 0) return 'Ikke angivet'
  if (!name) return details.join(', ')

  return details.length > 0 ? `${name} (${details.join(', ')})` : name
}

function formatBranch(
  selectedCompany: CompanyOption | undefined,
  cvrData: CvrHiddenFields | null,
): string {
  const selectedBranch = selectedCompany?.branchCodes[0]
  if (selectedBranch) {
    return selectedBranch.title
      ? `${selectedBranch.code} ${selectedBranch.title}`
      : selectedBranch.code
  }
  if (!cvrData?.industry_code) return 'Ikke angivet'

  return cvrData.industry_description
    ? `${cvrData.industry_code} ${cvrData.industry_description}`
    : cvrData.industry_code
}

function formatPostalCodeAndCity(
  selectedCompany: CompanyOption | undefined,
  cvrData: CvrHiddenFields | null,
): string {
  if (selectedCompany?.postalCodeAndCity) return selectedCompany.postalCodeAndCity
  if (!cvrData?.zip_code && !cvrData?.city) return 'Ikke angivet'

  return `${cvrData.zip_code} ${cvrData.city}`.trim()
}

function getDocumentValue(
  overenskomstStatus: string,
  overenskomstType: string,
  documentId: string,
): string {
  if (overenskomstStatus !== 'ja') return 'Ikke relevant'
  if (overenskomstType !== 'direkte') return 'Ikke påkrævet'
  return documentId ? 'Ja' : 'Nej'
}

function PriceEstimateDetails({ estimate }: { estimate: MembershipPriceEstimate }) {
  return (
    <div className={styles.approvalPrice}>
      <div className={styles.summaryPriceRows}>
        {estimate.rows.map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <strong>{formatDkk(row.amount)}</strong>
          </div>
        ))}
      </div>
      <p className={styles.summaryTotal}>
        <span>Estimeret pr. år</span>
        <strong>{formatDkk(estimate.annualTotal)}</strong>
        <small>Ekskl. moms</small>
      </p>
    </div>
  )
}

function ReviewSection({
  title,
  items,
  meta,
}: {
  title: string
  items: ReviewItem[]
  meta?: string
}) {
  return (
    <section className={styles.approvalReviewSection}>
      <header className={styles.approvalReviewSectionHeader}>
        <div>
          <h3>{title}</h3>
          {meta ? <span>{meta}</span> : null}
        </div>
      </header>
      <dl>
        {items.map((item) => (
          <div
            key={item.label}
            className={item.isWide ? styles.approvalReviewItemWide : undefined}
          >
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function ApprovalStep({
  formData,
  selectedCompany,
  cvrData,
  selectedServices,
  andetBeskrivelse,
  employeeCount,
  noEmployees,
  employeeTypes,
  totalLoensum,
  overenskomstStatus,
  overenskomstType,
  documentId,
  selectedFaellesskaber,
  allFaellesskaber,
  computedMembership,
  managingDirector,
  hrContact,
  payrollContact,
  authorizedSignatory,
  invoiceDelivery,
  acceptTerms,
  onAcceptTermsChange,
  acceptAuthority,
  onAcceptAuthorityChange,
  invalidField,
  validationMessage,
}: ApprovalStepProps) {
  const services = selectedServices.map((service) =>
    service === 'andet' && andetBeskrivelse
      ? `Andet: ${andetBeskrivelse}`
      : (SERVICE_LABELS[service] ?? service),
  )
  const employeeTypeLabels = employeeTypes.map((type) => EMPLOYEE_TYPE_LABELS[type] ?? type)
  const faellesskaber = selectedFaellesskaber.map(
    (id) => allFaellesskaber.find((item) => item.id === id)?.name ?? id,
  )
  const companyName = selectedCompany?.label || cvrData?.company_name || formData.companyId
  const cvrNumber = selectedCompany?.id || cvrData?.cvr_number || formData.companyId
  const address = selectedCompany?.address || cvrData?.address || 'Ikke angivet'
  const postalCodeAndCity = formatPostalCodeAndCity(selectedCompany, cvrData)
  const priceEstimate = calculateMembershipPriceEstimate({
    employeeCount,
    noEmployees,
    employeeTypes,
    totalLoensum,
    computedMembership,
    selectedFaellesskaber,
    selectedServices,
  })

  return (
    <div className={styles.approvalReview}>
      <ReviewSection
        title="Medlemskaber"
        items={[
          { label: 'Medlemstype', value: computedMembership ?? 'Ikke angivet' },
          { label: 'Virksomheden bliver indmeldt i', value: 'DI' },
          {
            label: 'Totallønsum',
            value: totalLoensum !== '' ? formatDkk(totalLoensum) : 'Ikke angivet',
          },
          {
            label: 'Antal ansatte',
            value: noEmployees
              ? 'Ingen ansatte'
              : employeeCount !== ''
                ? `${employeeCount} ansatte`
                : 'Ikke angivet',
          },
          { label: 'Medarbejdertyper', value: formatList(employeeTypeLabels) },
          { label: 'Branchefællesskaber', value: formatList(faellesskaber) },
          { label: 'Faktura', value: invoiceLabels[invoiceDelivery] ?? 'Ikke angivet' },
        ]}
      />

      <ReviewSection
        title="Aftaler"
        items={[
          { label: 'Ønsker og behov', value: formatList(services), isWide: true },
          {
            label: 'Aftaler',
            value: OVERENSKOMST_STATUS_LABELS[overenskomstStatus] ?? 'Ikke angivet',
          },
          {
            label: 'Type af overenskomst',
            value:
              overenskomstStatus === 'ja'
                ? (agreementTypeLabels[overenskomstType] ?? 'Ikke angivet')
                : 'Ikke relevant',
          },
          {
            label: 'Uploadet dokument',
            value: getDocumentValue(overenskomstStatus, overenskomstType, documentId),
          },
        ]}
      />

      <ReviewSection
        title="Virksomhedsinformation"
        items={[
          {
            label: 'Virksomhedens navn',
            value: `${companyName || 'Ikke angivet'}${cvrNumber ? ` (CVR: ${cvrNumber})` : ''}`,
            isWide: true,
          },
          {
            label: 'Virksomhedsform',
            value: selectedCompany?.companyType || cvrData?.company_type || 'Ikke angivet',
          },
          {
            label: 'Primær branche',
            value: formatBranch(selectedCompany, cvrData),
          },
          {
            label: 'Kontaktperson',
            value: formatContact({
              name: formData.contactName,
              title: formData.contactJobTitle,
              email: formData.contactEmail,
              phone: formData.contactPhone,
            }),
            isWide: true,
          },
        ]}
      />

      <ReviewSection
        title="Adresser"
        meta="Data fra CVR-registret"
        items={[
          {
            label: 'Hovedforhold',
            value: (
              <span className={styles.approvalValueStack}>
                <span>{companyName || 'Ikke angivet'}</span>
                <span>{address}</span>
                <span>{postalCodeAndCity}</span>
                <span>Hjemmeside: {formData.website || 'Ikke angivet'}</span>
              </span>
            ),
            isWide: true,
          },
        ]}
      />

      <ReviewSection
        title="Ledelse"
        items={[
          {
            label: 'Administrerende direktør',
            value: formatContact(managingDirector),
            isWide: true,
          },
          {
            label: 'Primær kontaktperson for personalejura',
            value: formatContact(hrContact),
            isWide: true,
          },
          {
            label: 'Lønsumsindberetter',
            value: formatContact(payrollContact),
            isWide: true,
          },
          {
            label: 'Tegningsberettiget',
            value: formatContact(authorizedSignatory),
            isWide: true,
          },
        ]}
      />

      <ReviewSection
        title="Dit DI medlemskab"
        items={[
          {
            label: 'Prisberegning',
            value: priceEstimate
              ? <PriceEstimateDetails estimate={priceEstimate} />
              : 'Afventer ansatte, lønsum og medarbejdertyper',
            isWide: true,
          },
        ]}
      />

      <section className={styles.approvalAcceptances}>
        <h3>Acceptér og bekræft</h3>
        <Checkbox
          name="acceptTerms"
          isSelected={acceptTerms}
          onChange={onAcceptTermsChange}
          isRequired
          isInvalid={invalidField === 'acceptTerms'}
          errorMessage={invalidField === 'acceptTerms' ? validationMessage : undefined}
        >
          Jeg accepterer DI's medlemsbetingelser og vedtægter
        </Checkbox>
        <p className={styles.termsLinks}>
          Læs DI's{' '}
          <a href={DI_TERMS_URL} target="_blank" rel="noreferrer">
            vilkår
          </a>{' '}
          og{' '}
          <a href={DI_PRIVACY_URL} target="_blank" rel="noreferrer">
            GDPR og privatlivspolitik
          </a>
          .
        </p>

        <Checkbox
          name="acceptAuthority"
          isSelected={acceptAuthority}
          onChange={onAcceptAuthorityChange}
          isRequired
          isInvalid={invalidField === 'acceptAuthority'}
          errorMessage={invalidField === 'acceptAuthority' ? validationMessage : undefined}
        >
          Jeg bekræfter at have bemyndigelse til at indmelde virksomheden
        </Checkbox>
      </section>
    </div>
  )
}
