import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import {
  EMPLOYEE_TYPE_LABELS,
  OVERENSKOMST_STATUS_LABELS,
  SERVICE_LABELS,
} from '../wizard.constants'
import { calculateMembershipPriceEstimate, formatDkk } from '../membershipPrice'
import type { ContactPerson } from './ContactPersonFields'
import type { CompanyOption, WizardFormData } from '../wizard.types'
import styles from '../WizardPage.module.scss'

type ApprovalStepProps = {
  formData: WizardFormData
  selectedCompany?: CompanyOption
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
  value: string
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
  if (!person?.name && !person?.email) return 'Ikke angivet'

  const details = [person.title, person.email, person.phone].filter(Boolean)
  return details.length > 0 ? `${person.name} (${details.join(', ')})` : person.name
}

function ReviewSection({
  title,
  items,
}: {
  title: string
  items: ReviewItem[]
}) {
  return (
    <section className={styles.approvalReviewSection}>
      <h3>{title}</h3>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
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
  const primaryBranch = selectedCompany?.branchCodes[0]
  const services = selectedServices.map((service) =>
    service === 'andet' && andetBeskrivelse
      ? `Andet: ${andetBeskrivelse}`
      : (SERVICE_LABELS[service] ?? service),
  )
  const employeeTypeLabels = employeeTypes.map((type) => EMPLOYEE_TYPE_LABELS[type] ?? type)
  const faellesskaber = selectedFaellesskaber.map(
    (id) => allFaellesskaber.find((item) => item.id === id)?.name ?? id,
  )
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
    <ContentBox>
      <div className={styles.approvalReview}>
        <ReviewSection
          title="Virksomhed"
          items={[
            {
              label: 'Virksomhedens navn',
              value: selectedCompany?.label ?? formData.companyId ?? 'Ikke angivet',
            },
            { label: 'CVR', value: selectedCompany?.id ?? formData.companyId ?? 'Ikke angivet' },
            {
              label: 'Primær branche',
              value: primaryBranch ? `${primaryBranch.code} ${primaryBranch.title}` : 'Ikke angivet',
            },
            { label: 'Website', value: formData.website || 'Ikke angivet' },
          ]}
        />

        <ReviewSection
          title="Kontakt og behov"
          items={[
            { label: 'Kontaktperson', value: formatContact({
              name: formData.contactName,
              title: formData.contactJobTitle,
              email: formData.contactEmail,
              phone: formData.contactPhone,
            }) },
            { label: 'Valgte services', value: formatList(services) },
          ]}
        />

        <ReviewSection
          title="Ansatte og aftaler"
          items={[
            {
              label: 'Antal ansatte',
              value: noEmployees
                ? 'Ingen ansatte'
                : employeeCount !== ''
                  ? `${employeeCount} ansatte`
                  : 'Ikke angivet',
            },
            { label: 'Medarbejdertyper', value: formatList(employeeTypeLabels) },
            {
              label: 'Samlet lønsum',
              value: totalLoensum !== '' ? formatDkk(totalLoensum) : 'Ikke angivet',
            },
            {
              label: 'Overenskomst',
              value: OVERENSKOMST_STATUS_LABELS[overenskomstStatus] ?? 'Ikke angivet',
            },
            {
              label: 'Type af overenskomst',
              value: agreementTypeLabels[overenskomstType] ?? 'Ikke angivet',
            },
            { label: 'Uploadet dokument', value: documentId ? 'Ja' : 'Nej' },
          ]}
        />

        <ReviewSection
          title="Medlemskab"
          items={[
            { label: 'Fællesskaber og foreninger', value: formatList(faellesskaber) },
            { label: 'Medlemstype', value: computedMembership ?? 'Ikke angivet' },
            {
              label: 'Prisberegning',
              value: priceEstimate
                ? `${formatDkk(priceEstimate.annualTotal)} pr. år ekskl. moms`
                : 'Afventer ansatte, lønsum og medarbejdertyper',
            },
          ]}
        />

        <ReviewSection
          title="Kontaktpersoner og faktura"
          items={[
            { label: 'Administrerende direktør', value: formatContact(managingDirector) },
            { label: 'HR-kontakt', value: formatContact(hrContact) },
            { label: 'Lønsumsinberetter', value: formatContact(payrollContact) },
            { label: 'Anden tegningsberettiget', value: formatContact(authorizedSignatory) },
            { label: 'Faktura', value: invoiceLabels[invoiceDelivery] ?? 'Ikke angivet' },
          ]}
        />
      </div>

      <div className={styles.approvalAcceptances}>
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
      </div>
    </ContentBox>
  )
}
