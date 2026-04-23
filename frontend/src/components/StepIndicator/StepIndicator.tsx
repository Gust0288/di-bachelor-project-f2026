import styles from './StepIndicator.module.scss'

type Step = {
  label: string
  status?: 'complete' | 'current' | 'upcoming'
}

type Props = {
  steps: Step[]
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

function StepIndicator({ steps, orientation = 'horizontal', className }: Props) {
  return (
    <ol
      className={[styles.stepIndicator, className].filter(Boolean).join(' ')}
      data-orientation={orientation}
    >
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={styles.stepIndicator__item}
          data-status={step.status ?? 'upcoming'}
        >
          <span className={styles.stepIndicator__marker}>{index + 1}</span>
          <span>{step.label}</span>
        </li>
      ))}
    </ol>
  )
}

export default StepIndicator
