import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'

type ApprovalStepProps = {
  acceptTerms: boolean
  onAcceptTermsChange: (value: boolean) => void
  acceptAuthority: boolean
  onAcceptAuthorityChange: (value: boolean) => void
}

export default function ApprovalStep({
  acceptTerms,
  onAcceptTermsChange,
  acceptAuthority,
  onAcceptAuthorityChange,
}: ApprovalStepProps) {
  return (
    <ContentBox
      title="Godkendelse"
      description="Gennemgå og acceptér betingelserne for at afslutte indmeldelsen."
    >
      <Checkbox isSelected={acceptTerms} onChange={onAcceptTermsChange} isRequired>
        Jeg accepterer DI's medlemsbetingelser og vedtægter
      </Checkbox>

      <Checkbox isSelected={acceptAuthority} onChange={onAcceptAuthorityChange} isRequired>
        Jeg bekræfter at have bemyndigelse til at indmelde virksomheden
      </Checkbox>
    </ContentBox>
  )
}
