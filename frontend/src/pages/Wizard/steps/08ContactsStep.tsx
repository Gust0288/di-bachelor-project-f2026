import { useState } from 'react'
import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import RadioCardGroup from '../../../components/RadioCardGroup/RadioCardGroup'
import ContactPersonFields, { type ContactPerson } from './ContactPersonFields'

const emptyContact = (): ContactPerson => ({ name: '', email: '', phone: '', title: '' })

type ContactsStepProps = {
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

export default function ContactsStep({
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
  const [showHr, setShowHr] = useState(hrContact !== null)
  const [showPayroll, setShowPayroll] = useState(payrollContact !== null)
  const [showSignatory, setShowSignatory] = useState(authorizedSignatory !== null)

  function toggleOptional(
    show: boolean,
    setShow: (v: boolean) => void,
    onChange: (v: ContactPerson | null) => void,
  ) {
    setShow(show)
    onChange(show ? emptyContact() : null)
  }

  return (
    <>
      <ContentBox
        title="Administrerende direktør"
        description="Oplysninger om administrerende direktør. Kontrollér at de er korrekte."
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
        <Checkbox
          isSelected={showHr}
          onChange={(checked) => toggleOptional(checked, setShowHr, onHrContactChange)}
        >
          Tilføj HR-kontakt
        </Checkbox>
        {showHr && hrContact ? (
          <ContactPersonFields value={hrContact} onChange={onHrContactChange} />
        ) : null}
      </ContentBox>

      <ContentBox
        title="Lønsumsinberreter"
        description="Den person der indberetter lønsum til DI."
      >
        <Checkbox
          isSelected={showPayroll}
          onChange={(checked) => toggleOptional(checked, setShowPayroll, onPayrollContactChange)}
        >
          Tilføj lønkontakt
        </Checkbox>
        {showPayroll && payrollContact ? (
          <ContactPersonFields value={payrollContact} onChange={onPayrollContactChange} />
        ) : null}
      </ContentBox>

      <ContentBox
        title="Anden tegningsberettiget"
        description="Udfyldes kun hvis en anden person end adm. dir. tegner virksomheden."
      >
        <Checkbox
          isSelected={showSignatory}
          onChange={(checked) =>
            toggleOptional(checked, setShowSignatory, onAuthorizedSignatoryChange)
          }
        >
          Tilføj tegningsberettiget
        </Checkbox>
        {showSignatory && authorizedSignatory ? (
          <ContactPersonFields
            value={authorizedSignatory}
            onChange={onAuthorizedSignatoryChange}
          />
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
