export type FlowField = {
  field_id: string
  type: string
  label: string
  required: boolean
  readonly?: boolean
  hint?: string
  source?: string
  autocomplete?: string
  options?: Array<{ value: string; label: string }>
  depends_on?: { field_id: string; value?: string; contains?: string }
  validation?: { pattern?: string; min?: number }
  accepted_types?: string[]
  upload_endpoint?: string
  mandatory_note?: string
  suggestions_endpoint?: string
  min_selections?: number
}

export type BlockingPopup = {
  title: string
  message: string
  phone: string
  email: string
}

export type BlockingOption = {
  field_id: string
  blocking_values: string[]
  popup: BlockingPopup
}

export type FlowStep = {
  step_number: number
  step_id: string
  title: string
  description: string
  fields: FlowField[]
  blocking_options: BlockingOption[] | null
  next_step: number | null
  display_fields?: Array<{ label: string; source: string }>
  backend_only?: boolean
  mock_in_development?: boolean
}

export type FlowDefinition = {
  version: string
  total_steps: number
  steps: FlowStep[]
}

export type SessionState = {
  session_id: string
  current_step: number
  tier: string | null
  flags: Record<string, unknown>
  step_data: Record<string, Record<string, unknown>>
  status: string
  expires_at: string
}

export type StepSubmitResponse = {
  session_id: string
  current_step: number
  tier: string | null
  flags: Record<string, unknown>
  is_blocked: boolean
  blocking_popup: BlockingPopup | null
  next_step: number | null
}

export type CvrHiddenFields = {
  cvr_number: string
  company_name: string
  company_type: string
  address: string
  zip_code: string
  city: string
  industry_code: string
  industry_description: string
}
