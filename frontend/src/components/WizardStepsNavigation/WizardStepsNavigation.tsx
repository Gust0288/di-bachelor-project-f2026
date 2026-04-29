import styles from './WizardStepsNavigation.module.scss'

export type WizardStep = {
  label: string
  status?: 'complete' | 'current' | 'upcoming'
}

export type WizardStepsNavigationProps = {
  steps: WizardStep[]
  orientation?: 'horizontal' | 'vertical'
  className?: string
  ariaLabel?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getStateClassName(status: WizardStep['status']) {
  switch (status) {
    case 'complete':
      return styles['is-complete']
    case 'current':
      return styles['is-current']
    default:
      return undefined
  }
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="m3.333 8.333 3 3 6.334-6.666"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function WizardStepsNavigation({
  steps,
  orientation = 'horizontal',
  className,
  ariaLabel = 'Wizard navigation',
}: WizardStepsNavigationProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ol
        className={cx(styles.wizardStepsNavigation, className)}
        data-orientation={orientation}
      >
        {steps.map((step, index) => {
          const status = step.status ?? 'upcoming'

          return (
            <li
              key={step.label}
              className={cx(
                styles.wizardStepsNavigationItem,
                getStateClassName(status),
              )}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              <span className={styles.wizardStepsNavigationItem__icon}>
                {status === 'complete' ? <CheckIcon /> : index + 1}
              </span>
              <span className={styles.wizardStepsNavigationItem__label}>
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default WizardStepsNavigation
