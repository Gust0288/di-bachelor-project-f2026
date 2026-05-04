import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './WizardLayout.module.scss'

interface WizardLayoutProps {
  progressIndicator: React.ReactNode
  summary: React.ReactNode
  children: React.ReactNode
}

export default function WizardLayout({ progressIndicator, summary, children }: WizardLayoutProps) {
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false)
  const [canCollapseSummary, setCanCollapseSummary] = useState(false)
  const isSummaryHidden = canCollapseSummary && isSummaryCollapsed
  const ToggleIcon = isSummaryCollapsed ? ChevronLeft : ChevronRight

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1244.98px)')

    function handleMediaChange() {
      setCanCollapseSummary(mediaQuery.matches)

      if (!mediaQuery.matches) {
        setIsSummaryCollapsed(false)
      }
    }

    handleMediaChange()
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => mediaQuery.removeEventListener('change', handleMediaChange)
  }, [])

  return (
    <div
      className={styles.layout}
      data-summary-collapsed={isSummaryHidden || undefined}
    >
      <aside className={styles.left}>{progressIndicator}</aside>
      <main className={styles.center}>{children}</main>
      <aside className={styles.right}>
        <div className={styles.summaryShell}>
          {canCollapseSummary ? (
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
    </div>
  )
}
