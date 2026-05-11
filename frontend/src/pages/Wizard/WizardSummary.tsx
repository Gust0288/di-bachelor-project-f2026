import type { ReactNode } from 'react'
import {
  calculateMembershipPriceEstimate,
  formatDkk,
  type MembershipPriceEstimate,
} from './membershipPrice'
import type { ContactPerson } from './steps/ContactPersonFields'
import type { CompanyOption, WizardFormData } from './wizard.types'
import styles from './WizardPage.module.scss'

type WizardSummaryProps = {
  currentStepIndex: number
  formData: WizardFormData
  selectedCompany?: CompanyOption
  selectedServices: string[]
  andetBeskrivelse: string
  employeeCount: number | ''
  noEmployees: boolean
  employeeTypes: string[]
  totalLoensum: number | ''
  overenskomstStatus: string
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
  selectedServices,
  employeeCount,
  noEmployees,
  employeeTypes,
  totalLoensum,
  selectedFaellesskaber,
  computedMembership,
  managingDirector,
}: WizardSummaryProps) {
  const primaryBranch = selectedCompany?.branchCodes[0]

  const employeeValue = noEmployees
    ? 'Ingen ansatte'
    : employeeCount !== ''
      ? `${employeeCount} ansatte`
      : null

  const totalLoensumValue = totalLoensum !== '' ? formatDkk(totalLoensum) : null
  const contactName = formData.contactName || managingDirector.name
  const contactEmail = formData.contactEmail || managingDirector.email
  const contactValue = contactName
    ? contactEmail
      ? `${contactName} (${contactEmail})`
      : contactName
    : null

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
    selectedCompany && {
      label: 'Virksomhedens navn',
      value: `${selectedCompany.label} (CVR: ${selectedCompany.id})`,
    },
    primaryBranch && {
      label: 'Primær branche',
      value: `${primaryBranch.code} ${primaryBranch.title}`,
    },
    contactValue && {
      label: 'Kontaktperson',
      value: contactValue,
    },
    computedMembership && {
      label: 'Medlemstype',
      value: computedMembership,
    },
    employeeValue && {
      label: 'Antal ansatte',
      value: employeeValue,
    },
    totalLoensumValue && {
      label: 'Samlet lønsum',
      value: totalLoensumValue,
    },
    priceEstimate && {
      label: 'Prisberegning',
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
