import type { WizardFormData } from './wizard.types'

const requiredProgressFields: Array<keyof WizardFormData> = [
  'contactName',
  'contactJobTitle',
  'contactEmail',
  'contactPhone',
  'companyId',
  'branchCodesCorrect',
]

const companyInformationRequiredFields: Array<keyof WizardFormData> = [
  'contactName',
  'contactJobTitle',
  'contactEmail',
  'contactPhone',
  'companyId',
]

function hasFieldValue(formData: WizardFormData, field: keyof WizardFormData) {
  return formData[field].trim().length > 0
}

export function calculateWizardProgress(formData: WizardFormData) {
  const completedFields = requiredProgressFields.filter(
    (field) => hasFieldValue(formData, field),
  ).length

  return Math.round((completedFields / requiredProgressFields.length) * 100)
}

export function hasCompletedCompanyInformation(formData: WizardFormData) {
  return companyInformationRequiredFields.every((field) =>
    hasFieldValue(formData, field),
  )
}

export function hasCompletedBranchInformation(formData: WizardFormData) {
  return hasFieldValue(formData, 'branchCodesCorrect')
}
