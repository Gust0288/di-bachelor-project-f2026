import { useEffect, useRef, useState } from 'react'
import { createSession, getFlow, getSession, saveStep as apiSaveStep } from '../../api/registration'
import type { FlowDefinition, StepSubmitResponse } from './types'

type WizardSessionState = {
  sessionId: string | null
  flow: FlowDefinition | null
  stepData: Record<string, Record<string, unknown>>
  tier: string | null
  flags: Record<string, unknown>
  isLoading: boolean
  error: string | null
}

type UseWizardSessionReturn = WizardSessionState & {
  saveStep: (stepNumber: number, data: Record<string, unknown>) => Promise<StepSubmitResponse>
  refetchSession: () => Promise<void>
}

export function useWizardSession(): UseWizardSessionReturn {
  const [state, setState] = useState<WizardSessionState>({
    sessionId: null,
    flow: null,
    stepData: {},
    tier: null,
    flags: {},
    isLoading: true,
    error: null,
  })
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      try {
        const [flowData, sessionData] = await Promise.all([getFlow(), createSession()])
        setState({
          sessionId: sessionData.session_id,
          flow: flowData,
          stepData: {},
          tier: null,
          flags: {},
          isLoading: false,
          error: null,
        })
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

  return { ...state, saveStep, refetchSession }
}
