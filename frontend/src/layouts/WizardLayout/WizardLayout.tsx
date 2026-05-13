import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useMediaQuery from '../../hooks/useMediaQuery'
import WizardHelpModal from '../../pages/Wizard/WizardHelpModal'
import styles from './WizardLayout.module.scss'

interface WizardLayoutProps {
  progressIndicator: React.ReactNode
  summary: React.ReactNode
  children: React.ReactNode
  centerRef?: React.RefObject<HTMLElement>
  summaryRef?: React.RefObject<HTMLElement>
}

export default function WizardLayout({
  progressIndicator,
  summary,
  children,
  centerRef,
  summaryRef,
}: WizardLayoutProps) {
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const canCollapseSummary = useMediaQuery('(max-width: 1244.98px)')
  const isSingleColumn = useMediaQuery('(max-width: 767.98px)')
  const canToggleSummary = canCollapseSummary && !isSingleColumn
  const isSummaryHidden = isSingleColumn || (canToggleSummary && isSummaryCollapsed)
  const ToggleIcon = isSummaryCollapsed ? ChevronLeft : ChevronRight

  useEffect(() => {
    if (!canToggleSummary) {
      setIsSummaryCollapsed(false)
    }
  }, [canToggleSummary])

  return (
    <div
      className={styles.layout}
      data-summary-collapsed={isSummaryHidden || undefined}
    >
      <aside className={styles.left}>{progressIndicator}</aside>
      <main ref={centerRef} className={styles.center}>{children}</main>
      <aside ref={summaryRef} className={styles.right}>
        <div className={styles.summaryShell}>
          {canToggleSummary ? (
            <button
              type="button"
              className={styles.summaryToggle}
              aria-label={
                isSummaryCollapsed ? 'Vis opsummering' : 'Skjul opsummering'
              }
              aria-expanded={!isSummaryCollapsed}
              title={
                isSummaryCollapsed ? 'Vis opsummering' : 'Skjul opsummering'
              }
              onClick={() => setIsSummaryCollapsed((current) => !current)}
            >
              <ToggleIcon aria-hidden="true" />
            </button>
          ) : null}
          <div className={styles.summaryContent} aria-hidden={isSummaryHidden}>
            {summary}
          </div>
        </div>
      </aside>

      <WizardHelpModal isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </div>
  )
}
