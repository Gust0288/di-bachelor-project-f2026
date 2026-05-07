import { OVERENSKOMST_STATUS_LABELS, SERVICE_LABELS } from './wizard.constants'
import type { ContactPerson } from './steps/ContactPersonFields'
import type { CompanyOption, WizardFormData } from './wizard.types'
import { wizardSteps } from './wizardSteps'
import styles from './WizardPage.module.scss'

const INVOICE_LABELS: Record<string, string> = {
  email: 'På e-mail',
  betalingsservice: 'Via Betalingsservice (BS)',
}

type WizardSummaryProps = {
  currentStepIndex: number
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
  currentStepIndex,
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

  const stepGroups: Array<{ stepIndex: number; items: SummaryItem[] }> = [
    {
      stepIndex: 0,
      items: [
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
      ].filter((item): item is SummaryItem => Boolean(item)),
    },
    {
      stepIndex: 2,
      items: [
        servicesValue && { label: 'Valgte services', value: servicesValue },
      ].filter((item): item is SummaryItem => Boolean(item)),
    },
    {
      stepIndex: 3,
      items: [
        employeeValue && { label: 'Antal ansatte', value: employeeValue },
      ].filter((item): item is SummaryItem => Boolean(item)),
    },
    {
      stepIndex: 4,
      items: [
        overenskomstValue && { label: 'Overenskomst', value: overenskomstValue },
      ].filter((item): item is SummaryItem => Boolean(item)),
    },
    {
      stepIndex: 5,
      items: [
        faellesskabValue && {
          label: 'Fællesskaber og foreninger',
          value: faellesskabValue,
        },
      ].filter((item): item is SummaryItem => Boolean(item)),
    },
    {
      stepIndex: 6,
      items: [
        computedMembership && {
          label: 'Beregnet medlemskab',
          value: computedMembership,
        },
      ].filter((item): item is SummaryItem => Boolean(item)),
    },
    {
      stepIndex: 7,
      items: groupedContactItems([
        { label: 'Administrerende direktør', person: managingDirector },
        { label: 'HR-kontakt', person: hrContact },
        { label: 'Lønsumsinberetter', person: payrollContact },
        { label: 'Anden tegningsberettiget', person: authorizedSignatory },
      ]),
    },
    {
      stepIndex: 8,
      items: [
        invoiceDelivery && {
          label: 'Faktura',
          value: INVOICE_LABELS[invoiceDelivery] ?? invoiceDelivery,
        },
      ].filter((item): item is SummaryItem => Boolean(item)),
    },
  ]

  const filledGroups = stepGroups.filter((g) => g.items.length > 0)
  const hasAnyItems = filledGroups.length > 0

  return (
    <section className={styles.summary} aria-labelledby="wizard-summary-title">
      <header className={styles.summaryHeader}>
        <h2 id="wizard-summary-title">Opsummering af dine valg</h2>
      </header>

      {hasAnyItems ? (
        stepGroups.map((group) =>
          group.items.length > 0 ? (
            <div
              key={group.stepIndex}
              data-step-index={group.stepIndex}
              className={styles.summaryGroup}
              data-active={group.stepIndex === currentStepIndex || undefined}
            >
              <p className={styles.summaryGroupLabel}>
                {wizardSteps[group.stepIndex]?.label}
              </p>
              <dl className={styles.summaryDetails}>
                {group.items.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null,
        )
      ) : (
        <p className={styles.summaryValueMuted}>
          Dine oplysninger vises her, efterhånden som du udfylder formularen.
        </p>
      )}
    </section>
  )
}
