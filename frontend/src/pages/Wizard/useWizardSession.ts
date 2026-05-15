import { useEffect, useRef, useState } from 'react'
import {
  confirmEmailVerification as apiConfirmEmailVerification,
  confirmEmailVerificationGlobal,
  getFlow,
  getSession,
  saveStep as apiSaveStep,
  sendEmailVerification as apiSendEmailVerification,
  sendEmailVerificationGlobal,
} from '../../api/registration'
import type { FlowDefinition, StepSubmitResponse } from './types'

type WizardSessionState = {
  sessionId: string | null
  flow: FlowDefinition | null
  stepData: Record<string, Record<string, unknown>>
  currentStep: number
  resumedAt: string | null
  tier: string | null
  flags: Record<string, unknown>
  emailVerified: boolean
  isLoading: boolean
  error: string | null
}

type UseWizardSessionReturn = WizardSessionState & {
  saveStep: (stepNumber: number, data: Record<string, unknown>) => Promise<StepSubmitResponse>
  refetchSession: () => Promise<void>
  sendEmailVerification: (stepData?: Record<string, unknown>) => Promise<string>
  confirmEmailVerification: (code: string) => Promise<void>
}

export function useWizardSession(): UseWizardSessionReturn {
  const [state, setState] = useState<WizardSessionState>({
    sessionId: null,
    flow: null,
    stepData: {},
    currentStep: 1,
    resumedAt: null,
    tier: null,
    flags: {},
    emailVerified: false,
    isLoading: true,
    error: null,
  })
  const initialized = useRef(false)
  // Holds the email between sendEmailVerification and confirmEmailVerification
  const pendingEmailRef = useRef<string | null>(null)
  // Holds the last step 1 data so resend can reuse it without re-passing
  const pendingStepDataRef = useRef<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const resumeSessionId = new URLSearchParams(window.location.search).get('session')

    async function init() {
      try {
        if (resumeSessionId) {
          const [flowData, sessionData] = await Promise.all([
            getFlow(),
            getSession(resumeSessionId),
          ])
          setState({
            sessionId: sessionData.session_id,
            flow: flowData,
            stepData: sessionData.step_data ?? {},
            currentStep: sessionData.current_step ?? 1,
            resumedAt: sessionData.updated_at,
            tier: sessionData.tier ?? null,
            flags: sessionData.flags ?? {},
            emailVerified: Boolean(sessionData.email_verified),
            isLoading: false,
            error: null,
          })
        } else {
          // Session oprettes IKKE her – sker først efter emailbekræftelse
          const flowData = await getFlow()
          setState((s) => ({
            ...s,
            flow: flowData,
            isLoading: false,
          }))
        }
      } catch (err) {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Ukendt fejl ved opstart',
        }))
      }
    }

    init()
  }, [])

  async function saveStep(
    stepNumber: number,
    data: Record<string, unknown>,
  ): Promise<StepSubmitResponse> {
    if (!state.sessionId) throw new Error('Ingen aktiv session')
    const response = await apiSaveStep(state.sessionId, stepNumber, data)
    setState((s) => ({
      ...s,
      stepData: { ...s.stepData, [String(stepNumber)]: data },
      currentStep: response.current_step,
      tier: response.tier,
      flags: response.flags,
    }))
    return response
  }

  async function sendEmailVerification(stepData?: Record<string, unknown>): Promise<string> {
    if (state.sessionId) {
      // Genoptagelse: session eksisterer allerede, brug gammel flow
      const response = await apiSendEmailVerification(state.sessionId)
      pendingEmailRef.current = response.email
      return response.email
    }
    // Ny session: send step 1-data med koden (ingen session endnu)
    const data = stepData ?? pendingStepDataRef.current
    if (!data) throw new Error('Mangler step 1-data til emailverifikation')
    pendingStepDataRef.current = data
    const response = await sendEmailVerificationGlobal(data)
    pendingEmailRef.current = response.email
    return response.email
  }

  async function confirmEmailVerification(code: string): Promise<void> {
    if (state.sessionId) {
      // Genoptagelse: session eksisterer allerede
      await apiConfirmEmailVerification(state.sessionId, code)
      setState((s) => ({ ...s, emailVerified: true }))
      return
    }
    // Ny session: bekræft og opret session
    const email = pendingEmailRef.current
    if (!email) throw new Error('Ingen email at bekræfte')
    const result = await confirmEmailVerificationGlobal(email, code)
    setState((s) => ({
      ...s,
      sessionId: result.session_id,
      currentStep: result.current_step,
      emailVerified: true,
      stepData: { ...s.stepData },
    }))
  }

  async function refetchSession(): Promise<void> {
    if (!state.sessionId) return
    const session = await getSession(state.sessionId)
    setState((s) => ({
      ...s,
      stepData: { ...s.stepData, ...session.step_data },
      currentStep: session.current_step,
      tier: session.tier,
      flags: session.flags,
      emailVerified: Boolean(session.email_verified),
    }))
  }

  return { ...state, saveStep, refetchSession, sendEmailVerification, confirmEmailVerification }
}
