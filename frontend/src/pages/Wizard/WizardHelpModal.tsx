import { HelpCircle, Mail, Phone, X } from 'lucide-react'
import Accordion, { type AccordionItem } from '../../components/Accordion'
import Button from '../../components/Button/Button'
import { Confirm, ConfirmContent } from '../../components/Confirm'
import styles from './WizardHelpModal.module.scss'

type WizardHelpModalProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const faqItems: AccordionItem[] = [
  {
    id: 'edit-answers',
    title: 'Kan jeg gå tilbage og rette oplysninger?',
    content: <p>Ja, du kan gå tilbage i flowet og ændre dine svar.</p>,
  },
  {
    id: 'company-data-source',
    title: 'Hvor kommer virksomhedsoplysningerne fra?',
    content: (
      <p>
        Oplysningerne hentes fra CVR og skal rettes på virk.dk, hvis de ikke er
        korrekte.
      </p>
    ),
  },
  {
    id: 'required-fields',
    title: 'Skal alle felter udfyldes med det samme?',
    content: (
      <p>
        Kun de påkrævede felter skal udfyldes for at fortsætte til næste trin.
      </p>
    ),
  },
]

export default function WizardHelpModal({
  isOpen,
  onOpenChange,
}: WizardHelpModalProps) {
  return (
    <>
      <Button
        type="button"
        variant="light"
        className={styles.helpButton}
        onPress={() => onOpenChange(true)}
      >
        <HelpCircle aria-hidden="true" />
        Hjælp
      </Button>

      <Confirm
        headline="Hjælp til indmeldelse"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        headerAction={
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Luk hjælp"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" />
          </button>
        }
      >
        <ConfirmContent className={styles.helpModalContent}>
          <section>
            <h3>Kontakt os</h3>
            <p>
              Har du brug for hjælp undervejs, kan DI hjælpe med spørgsmål om
              virksomhedsoplysninger, medlemskab og næste skridt.
            </p>
            <div className={styles.contactActions}>
              <a href="tel:+4533773377">
                <Phone aria-hidden="true" />
                +45 33 77 33 77
              </a>
              <a href="mailto:medlem@di.dk">
                <Mail aria-hidden="true" />
                medlem@di.dk
              </a>
            </div>
          </section>

          <section>
            <h3>FAQ</h3>
            <Accordion items={faqItems} className={styles.faqList} />
          </section>
        </ConfirmContent>
      </Confirm>
    </>
  )
}
