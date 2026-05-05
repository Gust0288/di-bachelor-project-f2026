import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import SummaryList from '../../../components/SummaryList/SummaryList'

type MembershipStepProps = {
  computedMembership: string | undefined
  acceptMembership: boolean
  onAcceptChange: (value: boolean) => void
}

export default function MembershipStep({
  computedMembership,
  acceptMembership,
  onAcceptChange,
}: MembershipStepProps) {
  return (
    <ContentBox
      title="Jeres medlemskab"
      description="Baseret på jeres oplysninger har vi beregnet den anbefalede medlemskabstype. Gennemgå og bekræft."
    >
      <SummaryList
        items={[
          {
            label: 'Anbefalet medlemskabstype',
            value: computedMembership ?? 'Beregnes...',
          },
          {
            label: 'Beregningsgrundlag',
            value: 'Antal ansatte, overenskomstsituation og valgte fællesskaber',
          },
        ]}
      />

      <Checkbox isSelected={acceptMembership} onChange={onAcceptChange} isRequired>
        Jeg bekræfter den anbefalede medlemskabstype
      </Checkbox>
    </ContentBox>
  )
}
