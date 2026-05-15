import type { ReactNode } from 'react'
import {
  calculateMembershipPriceEstimate,
  formatDkk,
  type MembershipPriceEstimate,
} from './membershipPrice'
import type { ContactPerson } from './steps/ContactPersonFields'
import type { CvrHiddenFields } from './types'
import type { CompanyOption, WizardFormData } from './wizard.types'
import styles from './WizardPage.module.scss'

type WizardSummaryProps = {
  currentStepIndex: number
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
}

type SummaryItem = {
  label: string
  value: ReactNode
}

type MaybeSummaryItem = SummaryItem | false | null | undefined | ''

function summaryItems(items: MaybeSummaryItem[]): SummaryItem[] {
  return items.filter((item): item is SummaryItem => Boolean(item))
}

function formatContact(person: ContactPerson | null | undefined): string | null {
  if (!person) return null

  const name = person.name.trim()
  const details = [person.title, person.email, person.phone]
    .map((value) => value.trim())
    .filter(Boolean)

  if (!name && details.length === 0) return null
  if (!name) return details.join(', ')

  return details.length > 0 ? `${name} (${details.join(', ')})` : name
}

function getPrimaryBranch(
  selectedCompany: CompanyOption | undefined,
  cvrData: CvrHiddenFields | null,
) {
  const selectedBranch = selectedCompany?.branchCodes[0]
  if (selectedBranch) return selectedBranch
  if (!cvrData?.industry_code) return null

  return {
    code: cvrData.industry_code,
    title: cvrData.industry_description,
  }
}

function PriceEstimateDetails({ estimate }: { estimate: MembershipPriceEstimate }) {
  return (
    <>
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
    </>
  )
}

export default function WizardSummary({
  formData,
  selectedCompany,
  cvrData,
  selectedServices,
  employeeCount,
  noEmployees,
  employeeTypes,
  totalLoensum,
  selectedFaellesskaber,
  computedMembership,
}: WizardSummaryProps) {
  const primaryBranch = getPrimaryBranch(selectedCompany, cvrData)

  const employeeValue = noEmployees
    ? 'Ingen ansatte'
    : employeeCount !== ''
      ? `${employeeCount} ansatte`
      : null
  const totalLoensumValue = totalLoensum !== '' ? formatDkk(totalLoensum) : null
  const employeeSummaryValue = employeeValue
    ? (
        <span className={styles.summaryValueStack}>
          <span>{employeeValue}</span>
          {totalLoensumValue ? (
            <span className={styles.summarySubValue}>
              Samlet lønsum: {totalLoensumValue}
            </span>
          ) : null}
        </span>
      )
    : null

  const contactValue = formatContact({
    name: formData.contactName,
    title: formData.contactJobTitle,
    email: formData.contactEmail,
    phone: formData.contactPhone,
  })
  const companyName = selectedCompany?.label || cvrData?.company_name

  const priceEstimate = calculateMembershipPriceEstimate({
    employeeCount,
    noEmployees,
    employeeTypes,
    totalLoensum,
    computedMembership,
    selectedFaellesskaber,
    selectedServices,
  })

  const summary = summaryItems([
    companyName && {
      label: 'Virksomhedens navn',
      value: companyName,
    },
    primaryBranch && {
      label: 'Primær branche',
      value: primaryBranch.title
        ? `${primaryBranch.code} ${primaryBranch.title}`
        : primaryBranch.code,
    },
    contactValue && {
      label: 'Kontaktperson',
      value: contactValue,
    },
    computedMembership && {
      label: 'Medlemstype',
      value: computedMembership,
    },
    employeeSummaryValue && {
      label: 'Antal ansatte',
      value: employeeSummaryValue,
    },
    priceEstimate && {
      label: 'Estimeret pris',
      value: <PriceEstimateDetails estimate={priceEstimate} />,
    },
  ])

  return (
    <section className={styles.summary} aria-labelledby="wizard-summary-title">
      <header className={styles.summaryHeader}>
        <h2 id="wizard-summary-title">Opsummering</h2>
      </header>

      {summary.length > 0 ? (
        <div className={styles.summaryGroup}>
          <dl className={styles.summaryDetails}>
            {summary.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className={styles.summaryValueMuted}>
          Dine oplysninger vises her, efterhånden som du udfylder formularen.
        </p>
      )}
    </section>
  )
}
