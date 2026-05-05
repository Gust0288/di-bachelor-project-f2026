import { CheckCircle2, ShieldCheck } from 'lucide-react'
import Button from '../../../components/Button/Button'
import ContentBox from '../../../components/ContentBox'
import styles from '../WizardPage.module.scss'

export type MitIdStatus = 'idle' | 'pending' | 'verified'

type MitIdVerificationStepProps = {
  status: MitIdStatus
  onVerify: () => void
}

export default function MitIdVerificationStep({
  status,
  onVerify,
}: MitIdVerificationStepProps) {
  const isPending = status === 'pending'
  const isVerified = status === 'verified'

  return (
    <ContentBox
      title="MitID verificering"
      description="Dette er en simpel simulering til prototypen og ikke en rigtig MitID-integration."
    >
      <div className={styles.mitIdSimulation}>
        <div className={styles.mitIdSimulation__brand} aria-hidden="true">
          {isVerified ? <CheckCircle2 /> : <ShieldCheck />}
          <strong>MitID</strong>
        </div>

        <div className={styles.mitIdSimulation__content}>
          <h2>{isVerified ? 'Godkendt' : 'Godkend indmeldelsen'}</h2>
          <p>
            {isVerified
              ? 'MitID-godkendelsen er gennemført, og indmeldelsen er klar til at blive afsluttet.'
              : 'Tryk på knappen for at simulere, at brugeren godkender indmeldelsen i MitID.'}
          </p>
        </div>

        <Button
          type="button"
          onPress={onVerify}
          isDisabled={isPending || isVerified}
          isSpinning={isPending}
          spinnerAriaLabel="Afventer MitID-godkendelse"
        >
          {isVerified ? 'Godkendt med MitID' : 'Send anmodning'}
        </Button>
      </div>
    </ContentBox>
  )
}
