import type { WizardFormData } from './wizard.types'

export const emptyValue = 'Ikke udfyldt'

export const initialFormData: WizardFormData = {
  contactName: '',
  contactJobTitle: '',
  contactEmail: '',
  contactPhone: '',
  companyId: '',
  website: '',
  branchCodesCorrect: '',
}
