import type { ReactNode } from 'react'
import {
  Button,
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type TooltipProps,
} from 'react-aria-components'
import styles from './Tooltip.module.scss'

type Props = Omit<TooltipProps, 'children' | 'className'> & {
  children: ReactNode
  content: ReactNode
  label?: string
  variant?: 'default' | 'remarkable'
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function Tooltip({
  children,
  content,
  label = 'Vis hjælpetekst',
  placement = 'top',
  variant = 'remarkable',
  className,
  ...props
}: Props) {
  return (
    <TooltipTrigger delay={250}>
      <Button className={styles.tooltip__trigger} aria-label={label}>
        {children}
      </Button>
      <AriaTooltip
        {...props}
        placement={placement}
        className={cx(
          styles.tooltip__bubble,
          variant === 'remarkable' && styles['tooltip__bubble--remarkable'],
          className,
        )}
      >
        <OverlayArrow className={styles.tooltip__arrow}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect
              x="8.5"
              width="11.9792"
              height="11.9792"
              rx="2"
              transform="rotate(45 8.5 0)"
              fill="currentColor"
            />
          </svg>
        </OverlayArrow>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  )
}

export default Tooltip
