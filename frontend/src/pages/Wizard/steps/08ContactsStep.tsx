import { useState } from 'react'
import Button from '../../../components/Button/Button'
import ContentBox from '../../../components/ContentBox'
import RadioCardGroup from '../../../components/RadioCardGroup/RadioCardGroup'
import ContactPersonFields, { type ContactPerson } from './ContactPersonFields'

const emptyContact = (): ContactPerson => ({ name: '', email: '', phone: '', title: '' })

type ContactMode = 'none' | 'step1' | 'custom'
type Step1Contact = { name: string; email: string; phone: string; title: string }

type ContactsStepProps = {
  step1Contact: Step1Contact
  managingDirector: ContactPerson
  onManagingDirectorChange: (value: ContactPerson) => void
  hrContact: ContactPerson | null
  onHrContactChange: (value: ContactPerson | null) => void
  payrollContact: ContactPerson | null
  onPayrollContactChange: (value: ContactPerson | null) => void
  authorizedSignatory: ContactPerson | null
  onAuthorizedSignatoryChange: (value: ContactPerson | null) => void
  invoiceDelivery: string
  onInvoiceDeliveryChange: (value: string) => void
}

function useOptionalContact(
  step1Contact: Step1Contact,
  onChange: (v: ContactPerson | null) => void,
) {
  const [mode, setMode] = useState<ContactMode>('none')

  function handleModeChange(next: string) {
    const m = next as ContactMode
    setMode(m)
    if (m === 'none') {
      onChange(null)
    } else if (m === 'step1') {
      onChange({ name: step1Contact.name, email: step1Contact.email, phone: step1Contact.phone, title: step1Contact.title })
    } else {
      onChange(emptyContact())
    }
  }

  return { mode, handleModeChange }
}

export default function ContactsStep({
  step1Contact,
  managingDirector,
  onManagingDirectorChange,
  hrContact,
  onHrContactChange,
  payrollContact,
  onPayrollContactChange,
  authorizedSignatory,
  onAuthorizedSignatoryChange,
  invoiceDelivery,
  onInvoiceDeliveryChange,
}: ContactsStepProps) {
  const hr = useOptionalContact(step1Contact, onHrContactChange)
  const payroll = useOptionalContact(step1Contact, onPayrollContactChange)
  const signatory = useOptionalContact(step1Contact, onAuthorizedSignatoryChange)

  const step1Option = {
    value: 'step1' as const,
    title: step1Contact.name || 'Kontaktperson fra trin 1',
    description: step1Contact.email || undefined,
  }

  function step1Action(current: ContactPerson, onChange: (v: ContactPerson) => void) {
    if (!step1Contact.name && !step1Contact.email) return undefined
    return (
      <Button
        type="button"
        variant="styleless"
        size="sm"
        onPress={() =>
          onChange({ ...current, name: step1Contact.name, email: step1Contact.email, phone: step1Contact.phone, title: step1Contact.title })
        }
      >
        Anvend fra trin 1
      </Button>
    )
  }

  return (
    <>
      <ContentBox
        title="Administrerende direktør"
        description="Oplysninger om administrerende direktør. Kontrollér at de er korrekte."
        action={step1Action(managingDirector, onManagingDirectorChange)}
      >
        <ContactPersonFields
          value={managingDirector}
          onChange={onManagingDirectorChange}
          isRequired
        />
      </ContentBox>

      <ContentBox
        title="Primær kontaktperson for personalejura"
        description="Den person DI kontakter ved personalejuridiske spørgsmål."
      >
        <RadioCardGroup
          label="Hvem er primær HR-kontakt?"
          options={[
            { value: 'none', title: 'Tilføj ikke' },
            step1Option,
            { value: 'custom', title: 'Tilføj anden kontaktperson' },
          ]}
          value={hr.mode}
          onChange={hr.handleModeChange}
        />
        {hr.mode !== 'none' && hrContact ? (
          <ContactPersonFields value={hrContact} onChange={onHrContactChange} />
        ) : null}
      </ContentBox>

      <ContentBox
        title="Lønsumsinberreter"
        description="Den person der indberetter lønsum til DI."
      >
        <RadioCardGroup
          label="Hvem indberetter lønsum?"
          options={[
            { value: 'none', title: 'Tilføj ikke' },
            step1Option,
            { value: 'custom', title: 'Tilføj anden kontaktperson' },
          ]}
          value={payroll.mode}
          onChange={payroll.handleModeChange}
        />
        {payroll.mode !== 'none' && payrollContact ? (
          <ContactPersonFields value={payrollContact} onChange={onPayrollContactChange} />
        ) : null}
      </ContentBox>

      <ContentBox
        title="Anden tegningsberettiget"
        description="Udfyldes kun hvis en anden person end adm. dir. tegner virksomheden."
      >
        <RadioCardGroup
          label="Er der en anden tegningsberettiget?"
          options={[
            { value: 'none', title: 'Nej' },
            step1Option,
            { value: 'custom', title: 'Tilføj anden kontaktperson' },
          ]}
          value={signatory.mode}
          onChange={signatory.handleModeChange}
        />
        {signatory.mode !== 'none' && authorizedSignatory ? (
          <ContactPersonFields value={authorizedSignatory} onChange={onAuthorizedSignatoryChange} />
        ) : null}
      </ContentBox>

      <ContentBox title="Faktura">
        <RadioCardGroup
          label="Hvordan ønsker I at modtage jeres faktura?"
          options={[
            { value: 'email', title: 'På e-mail' },
            { value: 'betalingsservice', title: 'Via Betalingsservice (BS)' },
          ]}
          value={invoiceDelivery}
          onChange={onInvoiceDeliveryChange}
          isRequired
        />
      </ContentBox>
    </>
  )
}
