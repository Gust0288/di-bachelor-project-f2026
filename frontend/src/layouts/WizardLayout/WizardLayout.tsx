import styles from './WizardLayout.module.scss'

interface WizardLayoutProps {
  progressIndicator: React.ReactNode
  summary: React.ReactNode
  children: React.ReactNode
}

export default function WizardLayout({ progressIndicator, summary, children }: WizardLayoutProps) {
  return (
    <div className={styles.layout}>
      <aside className={styles.left}>{progressIndicator}</aside>
      <main className={styles.center}>{children}</main>
      <aside className={styles.right}>{summary}</aside>
    </div>
  )
}
