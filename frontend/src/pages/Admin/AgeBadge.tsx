import styles from './AgeBadge.module.scss'
import { getDaysAgo } from './getDaysAgo'

interface Props {
  submittedAt: string
}

export default function AgeBadge({ submittedAt }: Props) {
  const days = getDaysAgo(submittedAt)
  const label = days === 0 ? 'I dag' : days === 1 ? '1 dag' : `${days} dage`
  const tier = days <= 3 ? 'low' : days <= 7 ? 'medium' : 'high'

  return (
    <span className={styles.badge} data-tier={tier}>
      {label}
    </span>
  )
}
