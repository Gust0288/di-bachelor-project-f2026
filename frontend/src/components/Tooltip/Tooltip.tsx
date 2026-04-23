import type { ReactNode } from 'react'
import {
  Button,
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type TooltipProps,
} from 'react-aria-components'
import styles from './Tooltip.module.scss'

type Props = Omit<TooltipProps, 'children'> & {
  children: ReactNode
  content: ReactNode
  label?: string
}

function Tooltip({
  children,
  content,
  label = 'Vis hjælpetekst',
  placement = 'top',
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
        className={styles.tooltip__bubble}
      >
        <OverlayArrow>
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
            <path d="M0 0 L4 4 L8 0" />
          </svg>
        </OverlayArrow>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  )
}

export default Tooltip
