import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginLayout from '../../layouts/LoginLayout/LoginLayout'
import Button from '../../components/Button/Button'
import InputField from '../../components/InputField/InputField'
import InlineAlert from '../../components/InlineAlert/InlineAlert'
import { OneTimePassword } from '../../components/OneTimePassword'
import { adminLogin, sendLoginOtp, verifyLoginOtp } from '../../api/auth'
import styles from './LoginPage.module.scss'

type View = 'email' | 'otp' | 'admin'

export default function LoginPage() {
  const navigate = useNavigate()

  const [view, setView] = useState<View>('email')
  const [email, setEmail] = useState('')
  const [otpValue, setOtpValue] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetError() {
    setError(null)
  }

  async function handleSendOtp() {
    setIsLoading(true)
    resetError()
    try {
      await sendLoginOtp(email.trim().toLowerCase())
      setView('otp')
      setOtpValue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl. Prøv igen.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(code: string) {
    setIsLoading(true)
    resetError()
    try {
      const { session_id } = await verifyLoginOtp(email.trim().toLowerCase(), code)
      navigate(`/wizard?session=${session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forkert kode. Prøv igen.')
      setOtpValue('')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAdminLogin() {
    setIsLoading(true)
    resetError()
    try {
      const { token } = await adminLogin(email.trim().toLowerCase(), adminPassword)
      sessionStorage.setItem('admin_token', token)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forkert email eller adgangskode.')
    } finally {
      setIsLoading(false)
    }
  }

  if (view === 'otp') {
    return (
      <LoginLayout>
        <div className={styles.card}>
          <h1 className={styles.title}>Bekræft din e-mail</h1>
          <div className={styles.otpWrapper}>
            <p className={styles.otpLabel}>
              Vi har sendt en 6-cifret kode til <strong>{email}</strong>
            </p>
            <OneTimePassword
              value={otpValue}
              onChange={setOtpValue}
              onComplete={handleVerifyOtp}
              isDisabled={isLoading}
              autoFocus
            />
            {error && <InlineAlert tone="danger">{error}</InlineAlert>}
            <Button
              onPress={() => handleVerifyOtp(otpValue)}
              isDisabled={otpValue.length < 6 || isLoading}
              isSpinning={isLoading}
            >
              Bekræft kode
            </Button>
          </div>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => {
              setView('email')
              setOtpValue('')
              resetError()
            }}
          >
            ← Tilbage
          </button>
        </div>
      </LoginLayout>
    )
  }

  if (view === 'admin') {
    return (
      <LoginLayout>
        <div className={styles.card}>
          <h1 className={styles.title}>Administrator login</h1>
          <form
            className={styles.form}
            onSubmit={(e) => { e.preventDefault(); handleAdminLogin() }}
          >
            <InputField
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
            />
            <InputField
              label="Adgangskode"
              type="password"
              autoComplete="current-password"
              value={adminPassword}
              onChange={setAdminPassword}
            />
            {error && <InlineAlert tone="danger">{error}</InlineAlert>}
            <div className={styles.actions}>
              <Button
                type="submit"
                isDisabled={!email || !adminPassword || isLoading}
                isSpinning={isLoading}
              >
                Log ind
              </Button>
            </div>
          </form>
          <button
            type="button"
            className={styles.backLink}
            onClick={() => {
              setView('email')
              setAdminPassword('')
              resetError()
            }}
          >
            ← Tilbage
          </button>
        </div>
      </LoginLayout>
    )
  }

  return (
    <LoginLayout>
      <div className={styles.card}>
        <h1 className={styles.title}>Bliv medlem af DI</h1>
        <form
          className={styles.form}
          onSubmit={(e) => { e.preventDefault(); handleSendOtp() }}
        >
          <InputField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
          {error && <InlineAlert tone="danger">{error}</InlineAlert>}
          <div className={styles.actions}>
            <Button
              type="submit"
              isDisabled={!email || isLoading}
              isSpinning={isLoading}
            >
              Send kode
            </Button>
            <span className={styles.divider}>eller</span>
            <Button
              type="button"
              variant="outline"
              onPress={() => navigate('/wizard')}
            >
              Start ny ansøgning
            </Button>
          </div>
        </form>
        <button
          type="button"
          className={styles.adminLink}
          onClick={() => {
            setView('admin')
            resetError()
          }}
        >
          Administrator login
        </button>
      </div>
    </LoginLayout>
  )
}
