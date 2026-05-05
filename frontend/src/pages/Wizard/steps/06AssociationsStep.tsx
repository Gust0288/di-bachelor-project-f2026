import { useEffect, useState } from 'react'
import Checkbox from '../../../components/Checkbox/Checkbox'
import ContentBox from '../../../components/ContentBox'
import { getBranchSuggestions } from '../../../api/registration'
import type { BranchSuggestionsResponse } from '../types'

type AssociationsStepProps = {
  sessionId: string
  selectedFaellesskaber: string[]
  onSelectionChange: (ids: string[]) => void
}

export default function AssociationsStep({
  sessionId,
  selectedFaellesskaber,
  onSelectionChange,
}: AssociationsStepProps) {
  const [suggestions, setSuggestions] = useState<BranchSuggestionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    getBranchSuggestions(sessionId)
      .then((data) => {
        setSuggestions(data)
        // Pre-select mandatory + suggested on first load
        if (selectedFaellesskaber.length === 0) {
          onSelectionChange([...data.mandatory, ...data.suggested])
        }
      })
      .catch(() => {/* non-critical — user can still proceed */})
      .finally(() => setIsLoading(false))
  // Only run once when sessionId is available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  function toggle(id: string, checked: boolean) {
    if (checked) {
      onSelectionChange([...selectedFaellesskaber, id])
    } else {
      onSelectionChange(selectedFaellesskaber.filter((s) => s !== id))
    }
  }

  if (isLoading) {
    return <ContentBox title="Branchefællesskaber"><p>Henter forslag...</p></ContentBox>
  }

  const mandatory = suggestions?.mandatory ?? []
  const suggested = suggestions?.suggested ?? []
  const all = suggestions?.all ?? []
  const otherIds = new Set([...mandatory, ...suggested])
  const others = all.filter((c) => !otherIds.has(c.id))

  return (
    <>
      {mandatory.length > 0 ? (
        <ContentBox
          title="Obligatorisk fællesskab"
          description="Baseret på jeres branchekode er I automatisk tilmeldt dette fællesskab. Det kan ikke fravælges."
        >
          {mandatory.map((id) => {
            const community = all.find((c) => c.id === id)
            return (
              <Checkbox key={id} isSelected isDisabled>
                {community?.name ?? id}
              </Checkbox>
            )
          })}
        </ContentBox>
      ) : null}

      {suggested.length > 0 ? (
        <ContentBox
          title="Foreslåede fællesskaber"
          description="Disse fællesskaber er relevante for jeres branche. I kan fravælge dem."
        >
          {suggested.map((id) => {
            const community = all.find((c) => c.id === id)
            return (
              <Checkbox
                key={id}
                isSelected={selectedFaellesskaber.includes(id)}
                onChange={(checked) => toggle(id, checked)}
              >
                {community?.name ?? id}
              </Checkbox>
            )
          })}
        </ContentBox>
      ) : null}

      {others.length > 0 ? (
        <ContentBox title="Andre fællesskaber" description="Tilmeld jer yderligere fællesskaber efter behov.">
          {others.map((community) => (
            <Checkbox
              key={community.id}
              isSelected={selectedFaellesskaber.includes(community.id)}
              onChange={(checked) => toggle(community.id, checked)}
            >
              {community.name}
            </Checkbox>
          ))}
        </ContentBox>
      ) : null}
    </>
  )
}
