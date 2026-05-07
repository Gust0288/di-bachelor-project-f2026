import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Button from '../../components/Button/Button'
import { Confirm, ConfirmContent, ConfirmFooter } from '../../components/Confirm'
import OneTimePassword from '../../components/OneTimePassword/OneTimePassword'
import styles from './EmailVerificationOverlay.module.scss'

type Props = {
  email: string
  isOpen: boolean
  onVerified: () => void
  onResend: () => Promise<void>
  onConfirm: (code: string) => Promise<void>
}

export default function EmailVerificationOverlay({
  email,
  isOpen,
  onVerified,
  onResend,
  onConfirm,
}: Readonly<Props>) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (!showSuccess) return
    const timer = setTimeout(onVerified, 5000)
    return () => clearTimeout(timer)
  }, [showSuccess, onVerified])

  async function handleConfirm() {
    if (code.length !== 6) return
    setError(null)
    setIsConfirming(true)
    try {
      await onConfirm(code)
      setShowSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forkert kode. Prøv igen.')
      setCode('')
    } finally {
      setIsConfirming(false)
    }
  }

  async function handleResend() {
    setError(null)
    setResendMessage(null)
    setIsResending(true)
    try {
      await onResend()
      setCode('')
      setResendMessage('En ny kode er sendt til din e-mail.')
    } catch {
      setError('Kunne ikke sende koden. Prøv igen.')
    } finally {
      setIsResending(false)
    }
  }

  if (showSuccess) {
    return (
      <Confirm
        headline=""
        isOpen={isOpen}
        isDismissable={false}
        onOpenChange={() => {}}
      >
        <ConfirmContent className={styles.successContent}>
          <div className={styles.successIcon}>
            <CheckCircle2 aria-hidden="true" />
          </div>
          <p className={styles.successTitle}>E-mail bekræftet</p>
          <p className={styles.successSubtitle}>Du fortsætter automatisk om et øjeblik…</p>
        </ConfirmContent>
      </Confirm>
    )
  }

  return (
    <Confirm
      headline="Bekræft din e-mail"
      isOpen={isOpen}
      isDismissable={false}
      onOpenChange={() => {}}
    >
      <ConfirmContent className={styles.content}>
        <p className={styles.description}>
          Vi har sendt en 6-cifret kode til <strong>{email}</strong>. Indtast koden nedenfor for at
          fortsætte.
        </p>

        <div className={styles.otpWrapper}>
          <OneTimePassword
            length={6}
            value={code}
            autoFocus
            isDisabled={isConfirming}
            onChange={setCode}
            onComplete={(val) => {
              setCode(val)
            }}
          />
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}
        {resendMessage ? <p className={styles.successMsg}>{resendMessage}</p> : null}

        <button
          type="button"
          className={styles.resendButton}
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? 'Sender…' : 'Send koden igen'}
        </button>
      </ConfirmContent>

      <ConfirmFooter className={styles.footer}>
        <Button
          type="button"
          isDisabled={code.length !== 6 || isConfirming}
          onPress={handleConfirm}
        >
          {isConfirming ? 'Bekræfter…' : 'Bekræft e-mail'}
        </Button>
      </ConfirmFooter>
    </Confirm>
  )
}
