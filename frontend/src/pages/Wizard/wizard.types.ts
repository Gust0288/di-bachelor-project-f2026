export type CvrResult = {
  navn: string
  cvr: number
  virksomhedsform: string
  adresse: string
  postnummer: string
  by: string
  branchekode: number
  branchetekst: string
}

export type BranchCode = {
  code: string
  title: string
}

export type CompanyOption = {
  id: string
  label: string
  description?: string
  companyType?: string
  address?: string
  postalCodeAndCity?: string
  startDate?: string
  branchCodes: BranchCode[]
  purpose?: string
}

export type WizardFormData = {
  contactName: string
  contactJobTitle: string
  contactEmail: string
  contactPhone: string
  companyId: string
  website: string
  branchCodesCorrect: string
}

export type WizardFieldUpdater = <Key extends keyof WizardFormData>(
  key: Key,
  value: WizardFormData[Key],
) => void
