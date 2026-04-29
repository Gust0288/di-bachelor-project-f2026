import { useEffect, useState } from 'react'
import LoginLayout from '../../layouts/LoginLayout/LoginLayout'
import { apiFetch } from '../../api/client'

type HealthResponse = { status: string; database: string }

export default function LoginPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)

  useEffect(() => {
    apiFetch<HealthResponse>('/health')
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', database: 'unreachable' }))
  }, [])

  return (
    <LoginLayout>
      <p>Backend: {health ? `${health.status} / db: ${health.database}` : 'connecting…'}</p>
    </LoginLayout>
  )
}
