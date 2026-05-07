import { useEffect, useRef, useState } from 'react'
import {
  confirmEmailVerification as apiConfirmEmailVerification,
  createSession,
  getFlow,
  getSession,
  saveStep as apiSaveStep,
  sendEmailVerification as apiSendEmailVerification,
} from '../../api/registration'
import type { FlowDefinition, StepSubmitResponse } from './types'

type WizardSessionState = {
  sessionId: string | null
  flow: FlowDefinition | null
  stepData: Record<string, Record<string, unknown>>
  currentStep: number
  tier: string | null
  flags: Record<string, unknown>
  isLoading: boolean
  error: string | null
}

type UseWizardSessionReturn = WizardSessionState & {
  saveStep: (stepNumber: number, data: Record<string, unknown>) => Promise<StepSubmitResponse>
  refetchSession: () => Promise<void>
  sendEmailVerification: () => Promise<string>
  confirmEmailVerification: (code: string) => Promise<void>
}

export function useWizardSession(): UseWizardSessionReturn {
  const [state, setState] = useState<WizardSessionState>({
    sessionId: null,
    flow: null,
    stepData: {},
    currentStep: 1,
    tier: null,
    flags: {},
    isLoading: true,
    error: null,
  })
  const initialized = useRef(false)

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
            tier: sessionData.tier ?? null,
            flags: sessionData.flags ?? {},
            isLoading: false,
            error: null,
          })
        } else {
          const [flowData, sessionData] = await Promise.all([getFlow(), createSession()])
          setState({
            sessionId: sessionData.session_id,
            flow: flowData,
            stepData: {},
            currentStep: 1,
            tier: null,
            flags: {},
            isLoading: false,
            error: null,
          })
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
    }))
    return response
  }

  async function sendEmailVerification(): Promise<string> {
    if (!state.sessionId) throw new Error('Ingen aktiv session')
    const response = await apiSendEmailVerification(state.sessionId)
    return response.email
  }

  async function confirmEmailVerification(code: string): Promise<void> {
    if (!state.sessionId) throw new Error('Ingen aktiv session')
    await apiConfirmEmailVerification(state.sessionId, code)
  }

  async function refetchSession(): Promise<void> {
    if (!state.sessionId) return
    const session = await getSession(state.sessionId)
    setState((s) => ({
      ...s,
      stepData: { ...s.stepData, ...session.step_data },
      tier: session.tier,
      flags: session.flags,
    }))
  }

  return { ...state, saveStep, refetchSession, sendEmailVerification, confirmEmailVerification }
}
