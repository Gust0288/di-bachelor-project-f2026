type MembershipPriceRule = {
  minimum: number
  payrollRate: number
  employeeRate: number
}

type PriceEstimateInput = {
  employeeCount: number | ''
  noEmployees: boolean
  employeeTypes: string[]
  totalLoensum: number | ''
  computedMembership: string | undefined
  selectedFaellesskaber: string[]
  selectedServices: string[]
}

export type PriceEstimateRow = {
  label: string
  amount: number
}

export type MembershipPriceEstimate = {
  annualTotal: number
  rows: PriceEstimateRow[]
}

const ESTIMATE_RULES_BY_MEMBERSHIP: Record<string, MembershipPriceRule> = {
  Associeret: { minimum: 3000, payrollRate: 0.0005, employeeRate: 120 },
  Arbejdsgiver: { minimum: 7500, payrollRate: 0.0012, employeeRate: 240 },
  Branchemedlem: { minimum: 9500, payrollRate: 0.0014, employeeRate: 260 },
  Erhvervsmedlem: { minimum: 8500, payrollRate: 0.001, employeeRate: 220 },
}

const ESTIMATE_EMPLOYEE_TYPE_RATES: Record<string, number> = {
  funktionaer: 0,
  timeloennet: 0.03,
  timeloennet_funktionaer_lignende: 0.015,
  vikar: 0.02,
  byggeri_og_anlaeg: 0.04,
  mandskabsudlejning: 0.035,
  ved_ikke: 0,
}

const ESTIMATE_FAELLESSKAB_FEES: Record<string, number> = {
  'di-biosolutions': 2200,
  'di-byggeri': 3500,
  'di-digital': 2500,
  'di-energi': 3000,
  'di-foedevarer': 2500,
  'di-handel': 2200,
  'di-lifescience': 3000,
  'di-produktion': 2500,
  'di-radgiverne': 2200,
  'di-service': 2200,
  'di-teknik-og-installation': 3000,
  'di-transport': 2800,
  'di-turisme-kultur-oplevelser': 1800,
}

const DEFAULT_FAELLESSKAB_FEE = 2200
const BYGGERI_COMMUNITY_SERVICES = new Set(['byggegaranti', 'di_byggeri_sektion'])

const dkkFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  maximumFractionDigits: 0,
})

function roundEstimate(amount: number): number {
  return Math.round(amount / 100) * 100
}

function getEffectiveFaellesskaber(
  selectedFaellesskaber: string[],
  selectedServices: string[],
): string[] {
  const ids = new Set(selectedFaellesskaber)
  if (selectedServices.some((service) => BYGGERI_COMMUNITY_SERVICES.has(service))) {
    ids.add('di-byggeri')
  }
  return [...ids]
}

export function formatDkk(amount: number): string {
  return dkkFormatter.format(amount)
}

export function calculateMembershipPriceEstimate({
  employeeCount,
  noEmployees,
  employeeTypes,
  totalLoensum,
  computedMembership,
  selectedFaellesskaber,
  selectedServices,
}: PriceEstimateInput): MembershipPriceEstimate | null {
  const normalizedEmployeeCount = noEmployees ? 0 : employeeCount

  if (normalizedEmployeeCount === '' || totalLoensum === '' || employeeTypes.length === 0) {
    return null
  }

  const membershipRule =
    ESTIMATE_RULES_BY_MEMBERSHIP[computedMembership ?? ''] ??
    ESTIMATE_RULES_BY_MEMBERSHIP.Associeret
  const payrollAmount = Math.max(0, totalLoensum) * membershipRule.payrollRate
  const employeeAmount = Math.max(0, normalizedEmployeeCount) * membershipRule.employeeRate
  const membershipAmount = roundEstimate(
    Math.max(membershipRule.minimum, payrollAmount + employeeAmount),
  )

  const employeeTypeRate = [...new Set(employeeTypes)].reduce(
    (sum, type) => sum + (ESTIMATE_EMPLOYEE_TYPE_RATES[type] ?? 0),
    0,
  )
  const employeeTypeAmount = roundEstimate(membershipAmount * employeeTypeRate)

  const faellesskabAmount = roundEstimate(
    getEffectiveFaellesskaber(selectedFaellesskaber, selectedServices).reduce(
      (sum, id) => sum + (ESTIMATE_FAELLESSKAB_FEES[id] ?? DEFAULT_FAELLESSKAB_FEE),
      0,
    ),
  )

  const rows: PriceEstimateRow[] = [
    { label: 'DI-kontingent', amount: membershipAmount },
  ]

  if (employeeTypeAmount > 0) {
    rows.push({ label: 'Medarbejdertyper', amount: employeeTypeAmount })
  }

  if (faellesskabAmount > 0) {
    rows.push({ label: 'Fællesskaber og foreninger', amount: faellesskabAmount })
  }

  return {
    annualTotal: rows.reduce((sum, row) => sum + row.amount, 0),
    rows,
  }
}
