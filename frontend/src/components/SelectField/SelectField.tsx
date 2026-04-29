import {
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text,
  type SelectProps,
} from 'react-aria-components'
import { ChevronDown } from 'lucide-react'
import styles from './SelectField.module.scss'

type Option = {
  id: string
  label: string
  description?: string
}

type Props = Omit<SelectProps<Option>, 'children'> & {
  label: string
  description?: string
  options: Option[]
}

function SelectField({ label, description, options, className, ...props }: Props) {
  return (
    <Select
      {...props}
      className={[styles.selectField, className].filter(Boolean).join(' ')}
    >
      <Label className={styles.selectField__label}>{label}</Label>
      <Button className={styles.selectField__button}>
        <SelectValue />
        <span className={styles.selectField__chevron} aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </Button>
      {description ? (
        <Text slot="description" className={styles.selectField__description}>
          {description}
        </Text>
      ) : null}
      <FieldError className={styles.selectField__error} />
      <Popover className={styles.selectField__popover}>
        <ListBox className={styles.selectField__list} items={options}>
          {(option) => (
            <ListBoxItem
              id={option.id}
              textValue={option.label}
              className={styles.selectField__item}
            >
              <span>{option.label}</span>
              {option.description ? <small>{option.description}</small> : null}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  )
}

export default SelectField
