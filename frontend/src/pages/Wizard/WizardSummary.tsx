import { OVERENSKOMST_STATUS_LABELS, SERVICE_LABELS } from './wizard.constants'
import type { ContactPerson } from './steps/ContactPersonFields'
import type { CompanyOption, WizardFormData } from './wizard.types'
import styles from './WizardPage.module.scss'

const INVOICE_LABELS: Record<string, string> = {
  email: 'På e-mail',
  betalingsservice: 'Via Betalingsservice (BS)',
}

type WizardSummaryProps = {
  formData: WizardFormData
  selectedCompany?: CompanyOption
  selectedServices: string[]
  andetBeskrivelse: string
  employeeCount: number | ''
  noEmployees: boolean
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
  value: string
}

function groupedContactItems(
  entries: { label: string; person: ContactPerson | null }[],
): SummaryItem[] {
  const groups = new Map<string, { labels: string[]; value: string }>()
  for (const { label, person } of entries) {
    if (!person?.name) continue
    const key = `${person.name}|${person.email}`
    const value = person.email ? `${person.name} (${person.email})` : person.name
    if (groups.has(key)) {
      groups.get(key)!.labels.push(label)
    } else {
      groups.set(key, { labels: [label], value })
    }
  }
  return [...groups.values()].map(({ labels, value }) => ({
    label: labels.join(' / '),
    value,
  }))
}

export default function WizardSummary({
  formData,
  selectedCompany,
  selectedServices,
  andetBeskrivelse,
  employeeCount,
  noEmployees,
  overenskomstStatus,
  selectedFaellesskaber,
  allFaellesskaber,
  computedMembership,
  managingDirector,
  hrContact,
  payrollContact,
  authorizedSignatory,
  invoiceDelivery,
}: WizardSummaryProps) {
  const primaryBranch = selectedCompany?.branchCodes[0]

  const employeeValue = noEmployees
    ? 'Ingen ansatte'
    : employeeCount !== ''
      ? `${employeeCount} ansatte`
      : null

  const servicesValue =
    selectedServices.length > 0
      ? selectedServices
          .map((s) =>
            s === 'andet' && andetBeskrivelse
              ? `Andet: ${andetBeskrivelse}`
              : (SERVICE_LABELS[s] ?? s),
          )
          .join(', ')
      : null

  const overenskomstValue = OVERENSKOMST_STATUS_LABELS[overenskomstStatus] ?? null

  const faellesskabValue =
    selectedFaellesskaber.length > 0
      ? selectedFaellesskaber
          .map((id) => allFaellesskaber.find((f) => f.id === id)?.name ?? id)
          .join(', ')
      : null

  const summaryItems = [
    selectedCompany && {
      label: 'Virksomhedens navn',
      value: `${selectedCompany.label} (CVR: ${selectedCompany.id})`,
    },
    primaryBranch && {
      label: 'Primær branche',
      value: `${primaryBranch.code} ${primaryBranch.title}`,
    },
    formData.contactName && {
      label: 'Kontaktperson',
      value: formData.contactName,
    },
    servicesValue && {
      label: 'Valgte services',
      value: servicesValue,
    },
    employeeValue && {
      label: 'Antal ansatte',
      value: employeeValue,
    },
    overenskomstValue && {
      label: 'Overenskomst',
      value: overenskomstValue,
    },
    faellesskabValue && {
      label: 'Fællesskaber og foreninger',
      value: faellesskabValue,
    },
    computedMembership && {
      label: 'Beregnet medlemskab',
      value: computedMembership,
    },
    ...groupedContactItems([
      { label: 'Administrerende direktør', person: managingDirector },
      { label: 'HR-kontakt', person: hrContact },
      { label: 'Lønsumsinberetter', person: payrollContact },
      { label: 'Anden tegningsberettiget', person: authorizedSignatory },
    ]),
    invoiceDelivery && {
      label: 'Faktura',
      value: INVOICE_LABELS[invoiceDelivery] ?? invoiceDelivery,
    },
  ].filter((item): item is SummaryItem => Boolean(item))

  return (
    <section className={styles.summary} aria-labelledby="wizard-summary-title">
      <header className={styles.summaryHeader}>
        <h2 id="wizard-summary-title">Opsummering af dine valg</h2>
      </header>

      {summaryItems.length > 0 ? (
        <dl className={styles.summaryDetails}>
          {summaryItems.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.summaryValueMuted}>
          Dine oplysninger vises her, efterhånden som du udfylder formularen.
        </p>
      )}
    </section>
  )
}
