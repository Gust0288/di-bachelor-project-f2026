import { useState } from 'react'
import { CheckCircle2, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react'
import Button from '../../../components/Button/Button'
import styles from '../WizardPage.module.scss'

export type MitIdStatus = 'idle' | 'redirecting' | 'login' | 'approving' | 'verified'

type MitIdVerificationStepProps = {
  status: MitIdStatus
  onVerify: () => void
}

export default function MitIdVerificationStep({
  status,
  onVerify,
}: MitIdVerificationStepProps) {
  const [userId, setUserId] = useState('')
  const isRedirecting = status === 'redirecting'
  const isLogin = status === 'login'
  const isApproving = status === 'approving'
  const isBusy = isRedirecting || isApproving

  if (status === 'idle') {
    return (
      <section className={styles.mitIdStartCard}>
        <header className={styles.mitIdStartCard__header}>
          <h2>MitID verificering</h2>
          <p>
            Du bliver sendt videre til MitID og godkender indmeldelsen. Efter godkendelsen vises en kvittering.
          </p>
        </header>

        <div className={styles.mitIdSimulation}>
          <div className={styles.mitIdSimulation__brand} aria-hidden="true">
            <ShieldCheck />
            <strong>MitID</strong>
          </div>

          <div className={styles.mitIdSimulation__content}>
            <h2>Godkend indmeldelsen</h2>
            <p>Du forlader DI kortvarigt for at godkende anmodningen med MitID.</p>
          </div>

          <Button type="button" onPress={onVerify}>
            Fortsæt til MitID
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.mitIdExternalPage} aria-live="polite">
      <div className={styles.mitIdExternalPage__content}>
        <div className={styles.mitIdLoginPanel}>
          <div className={styles.mitIdLoginPanel__brand}>
            <span>MitID</span>
          </div>

          {isRedirecting ? (
            <>
              <ShieldCheck aria-hidden="true" />
              <h2>Du sendes videre</h2>
              <p>Der oprettes en sikker login-anmodning hos MitID.</p>
              <div className={styles.mitIdProgress} aria-hidden="true">
                <span />
              </div>
            </>
          ) : isLogin ? (
            <>
              <LockKeyhole aria-hidden="true" />
              <h2>Log ind med MitID</h2>
              <p>Godkend DI-indmeldelsen med dit MitID.</p>

              <label className={styles.mitIdLoginPanel__field}>
                Bruger-ID
                <input
                  placeholder="Indtast bruger-ID"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                />
              </label>

              <div className={styles.mitIdLoginPanel__device}>
                <Smartphone aria-hidden="true" />
                <span>Åbn MitID appen og godkend anmodningen</span>
              </div>

              <Button type="button" onPress={onVerify} isDisabled={userId.trim().length < 4}>
                Godkend i MitID
              </Button>
            </>
          ) : isApproving ? (
            <>
              <ShieldCheck aria-hidden="true" />
              <h2>Godkendelse modtaget</h2>
              <p>Godkendelsen behandles. Når den er registreret, vises kvitteringen.</p>
              <div className={styles.mitIdProgress} aria-hidden="true">
                <span />
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 aria-hidden="true" />
              <h2>Kvittering</h2>
              <p>Identiteten er verificeret, og indmeldelsen er godkendt med MitID.</p>
            </>
          )}

          {isBusy ? (
            <span className={styles.mitIdLoginPanel__status}>
              {isRedirecting ? 'Forbinder...' : 'Sender svar tilbage...'}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  )
}
