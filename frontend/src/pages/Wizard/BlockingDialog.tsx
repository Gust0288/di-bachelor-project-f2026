import { Mail, Phone } from 'lucide-react'
import Button from '../../components/Button/Button'
import { Confirm, ConfirmContent } from '../../components/Confirm'
import type { BlockingPopup } from './types'
import styles from './WizardHelpModal.module.scss'

type BlockingDialogProps = {
  popup: BlockingPopup | null
  onClose: () => void
}

export default function BlockingDialog({ popup, onClose }: BlockingDialogProps) {
  return (
    <Confirm
      headline={popup?.title ?? ''}
      isOpen={popup !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <ConfirmContent className={styles.helpModalContent}>
        <section>
          <p>{popup?.message}</p>
          {popup?.phone || popup?.email ? (
            <div className={styles.contactActions}>
              {popup.phone ? (
                <a href={`tel:${popup.phone.replace(/\s/g, '')}`}>
                  <Phone aria-hidden="true" />
                  {popup.phone}
                </a>
              ) : null}
              {popup.email ? (
                <a href={`mailto:${popup.email}`}>
                  <Mail aria-hidden="true" />
                  {popup.email}
                </a>
              ) : null}
            </div>
          ) : null}
        </section>

        <Button type="button" onPress={onClose}>
          Gå tilbage og ret svar
        </Button>
      </ConfirmContent>
    </Confirm>
  )
}
