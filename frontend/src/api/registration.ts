import { apiFetch } from './client'
import type { FlowDefinition, SessionState, StepSubmitResponse } from '../pages/Wizard/types'

type CreateSessionResponse = {
  session_id: string
  current_step: number
  expires_at: string
}

export function getFlow(): Promise<FlowDefinition> {
  return apiFetch<FlowDefinition>('/registration/flow')
}

export function createSession(): Promise<CreateSessionResponse> {
  return apiFetch<CreateSessionResponse>('/registration/session', { method: 'POST' })
}

export function getSession(sessionId: string): Promise<SessionState> {
  return apiFetch<SessionState>(`/registration/session/${sessionId}`)
}

export function saveStep(
  sessionId: string,
  stepNumber: number,
  data: Record<string, unknown>,
): Promise<StepSubmitResponse> {
  return apiFetch<StepSubmitResponse>(
    `/registration/session/${sessionId}/step/${stepNumber}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  )
}
