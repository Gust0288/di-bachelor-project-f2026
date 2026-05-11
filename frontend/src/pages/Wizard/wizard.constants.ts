import type { WizardFormData } from './wizard.types'

export const emptyValue = 'Ikke udfyldt'

export const SERVICE_LABELS: Record<string, string> = {
  overenskomst: 'Overenskomst',
  personalejuridisk_raadgivning: 'Personalejuridisk rådgivning',
  erhvervsjuridisk_raadgivning: 'Erhvervsjuridisk rådgivning',
  byggegaranti: 'Byggegaranti',
  di_byggeri_sektion: 'Medlemskab af sektion i DI Byggeri',
  andet: 'Andet',
}

export const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  funktionaer: 'Funktionær (funktionærkontrakt)',
  timeloennet: 'Timelønnet',
  timeloennet_funktionaer_lignende: 'Timelønnet ansat på funktionærlignende kontrakt',
  vikar: 'Vikar',
  byggeri_og_anlaeg: 'Medarbejdere inden for byggeri og anlæg',
  mandskabsudlejning: 'Mandskabsudlejning',
  ved_ikke: 'Ved ikke',
}

export const OVERENSKOMST_STATUS_LABELS: Record<string, string> = {
  nej: 'Nej',
  ved_ikke: 'Ved ikke',
  ja: 'Ja',
}

export const initialFormData: WizardFormData = {
  contactName: '',
  contactJobTitle: '',
  contactEmail: '',
  contactPhone: '',
  companyId: '',
  website: '',
  branchCodesCorrect: '',
}
