import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components'
import styles from './Button.module.scss'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = AriaButtonProps & {
  variant?: Variant
  size?: Size
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: Props) {
  const classes = [
    styles.button,
    styles[`button--${variant}`],
    size !== 'md' && styles[`button--${size}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AriaButton {...props} className={classes}>
      {children}
    </AriaButton>
  )
}

export default Button