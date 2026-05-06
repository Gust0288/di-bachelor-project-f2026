import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import SummaryList from '../../../components/SummaryList/SummaryList'

const TIER_LABELS: Record<string, string> = {
  mikro: 'Mikro',
  smv: 'SMV',
  erhverv: 'Erhverv',
}

const ARBEJDSGIVER_SERVICES = new Set([
  'overenskomst',
  'personalejuridisk_raadgivning',
  'erhvervsjuridisk_raadgivning',
])

const SERVICE_LABELS: Record<string, string> = {
  overenskomst: 'Overenskomst',
  personalejuridisk_raadgivning: 'Personalejuridisk rådgivning',
  erhvervsjuridisk_raadgivning: 'Erhvervsjuridisk rådgivning',
  byggegaranti: 'Byggegaranti',
  di_byggeri_sektion: 'Medlemskab af sektion i DI Byggeri',
  andet: 'Andet',
}

const OVERENSKOMST_LABELS: Record<string, string> = {
  nej: 'Nej',
  ved_ikke: 'Ved ikke',
  ja_direkte: 'Ja, direkte med fagforbund',
  ja_anden: 'Ja, med anden arbejdsgiverorganisation',
}

type MembershipStepProps = {
  computedMembership: string | undefined
  tier: string | null
  flags: Record<string, unknown>
  employeeCount: number | undefined
  selectedServices: string[] | undefined
  overenskomstStatus: string | undefined
  overenskomstType: string | undefined
  branchefaellesskaber: string[] | undefined
  acceptMembership: boolean
  onAcceptChange: (value: boolean) => void
}

function deriveReason(
  tier: string | null,
  flags: Record<string, unknown>,
  selectedServices: string[] | undefined,
): string {
  if (!tier) return 'Udfyld de foregående trin for at se beregningsgrundlaget.'
  if (tier === 'erhverv') return 'Baseret på virksomhedens størrelse (50+ ansatte).'
  if (tier === 'mikro') return 'Baseret på virksomhedens størrelse (under 10 ansatte).'
  // smv
  if (flags.established_ag) return 'Baseret på jeres overenskomstsituation (direkte aftale med fagforbund).'
  const activeServices = (selectedServices ?? []).filter((s) => ARBEJDSGIVER_SERVICES.has(s))
  if (activeServices.length > 0) return 'Baseret på jeres valgte services.'
  return 'Baseret på virksomhedens størrelse (10–49 ansatte).'
}

export default function MembershipStep({
  computedMembership,
  tier,
  flags,
  employeeCount,
  selectedServices,
  overenskomstStatus,
  overenskomstType,
  branchefaellesskaber,
  acceptMembership,
  onAcceptChange,
}: MembershipStepProps) {
  const tierLabel = tier ? TIER_LABELS[tier] ?? tier : null
  const sizeValue = tierLabel
    ? employeeCount !== undefined
      ? `${tierLabel} (${employeeCount} ansatte)`
      : tierLabel
    : 'Beregnes...'

  const ovkKey =
    overenskomstStatus === 'ja' && overenskomstType
      ? `ja_${overenskomstType}`
      : overenskomstStatus ?? ''
  const overenskomstValue = OVERENSKOMST_LABELS[ovkKey] ?? overenskomstStatus ?? 'Ikke angivet'

  const allServices = selectedServices ?? []
  const servicesValue =
    allServices.length > 0
      ? allServices.map((s) => SERVICE_LABELS[s] ?? s).join(', ')
      : 'Ingen valgt'

  const branchCount = branchefaellesskaber?.length ?? 0
  const branchValue =
    branchCount > 0
      ? `${branchCount} ${branchCount === 1 ? 'fællesskab' : 'fællesskaber'} valgt`
      : 'Ingen valgt'

  const reason = deriveReason(tier, flags, selectedServices)

  const summaryItems = [
    { label: 'Virksomhedsstørrelse', value: sizeValue },
    { label: 'Overenskomst', value: overenskomstValue },
    { label: 'Valgte services', value: servicesValue },
    { label: 'Branchefællesskaber', value: branchValue },
  ]

  return (
    <ContentBox
      title="Jeres medlemskab"
      description="Baseret på jeres oplysninger har vi beregnet den anbefalede medlemskabstype."
    >
      <SummaryList items={summaryItems} />

      <div>
        <strong>{computedMembership ?? 'Beregnes...'}</strong>
        <p>{reason}</p>
      </div>

      <Checkbox isSelected={acceptMembership} onChange={onAcceptChange} isRequired>
        Jeg bekræfter den anbefalede medlemskabstype
      </Checkbox>
    </ContentBox>
  )
}
