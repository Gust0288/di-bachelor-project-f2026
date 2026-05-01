import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import OneTimePassword from './OneTimePassword'
import { useOneTimePassword } from './hooks/useOneTimePassword'

function ControlledOtp({
  length = 4,
  initialValue = '',
  onChange = jest.fn(),
  onComplete,
  autoFocus,
  isDisabled,
}: {
  length?: number
  initialValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  autoFocus?: boolean
  isDisabled?: boolean
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <OneTimePassword
      length={length}
      value={value}
      autoFocus={autoFocus}
      isDisabled={isDisabled}
      onComplete={onComplete}
      onChange={(nextValue) => {
        setValue(nextValue)
        onChange(nextValue)
      }}
    />
  )
}

function HookProbe() {
  const [digits, setDigits] = useState(['1'])
  const { inputPropsAt } = useOneTimePassword({
    length: 2,
    digits,
    setDigits,
  })

  return (
    <>
      <input aria-label="first" {...inputPropsAt(0)} />
      <input aria-label="second" {...inputPropsAt(1)} />
    </>
  )
}

describe('OneTimePassword', () => {
  it('normalizes initial value, supports autofocus, and completes entry', async () => {
    const onComplete = jest.fn()
    const user = userEvent.setup()

    render(
      <ControlledOtp
        length={4}
        initialValue="1a2"
        autoFocus
        onComplete={onComplete}
      />,
    )

    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveFocus()
    expect(inputs[0]).toHaveValue('1')
    expect(inputs[1]).toHaveValue('2')

    await user.type(inputs[2], '3')
    await user.type(inputs[3], '4')

    expect(onComplete).toHaveBeenCalledWith('1234')
  })

  it('filters non-digits, fills from multi-character input, and truncates', async () => {
    const onChange = jest.fn()

    render(<ControlledOtp length={4} onChange={onChange} />)

    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'a12345' },
    })

    expect(onChange).toHaveBeenLastCalledWith('1234')
  })

  it('handles paste, backspace, arrows, and space', async () => {
    const user = userEvent.setup()
    render(<ControlledOtp length={4} initialValue="12" />)

    const inputs = screen.getAllByRole('textbox')
    await user.click(inputs[1])
    await user.keyboard('{ArrowLeft}')
    expect(inputs[0]).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(inputs[1]).toHaveFocus()

    await user.keyboard('{Backspace}')
    expect(inputs[1]).toHaveValue('')

    await user.keyboard('{Backspace}')
    expect(inputs[0]).toHaveFocus()
    expect(inputs[0]).toHaveValue('')

    await user.paste('9876')
    expect(inputs[0]).toHaveValue('9')
    expect(inputs[3]).toHaveValue('6')

    await user.keyboard(' ')
    expect(inputs[0]).toHaveValue('9')
  })

  it('ignores empty/non-digit paste and supports disabled state', async () => {
    const { rerender } = render(<ControlledOtp length={2} initialValue="1" />)

    const inputs = screen.getAllByRole('textbox')
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '' },
    })
    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => 'abc' },
    })

    expect(inputs[0]).toHaveValue('1')

    rerender(<ControlledOtp length={2} initialValue="1" isDisabled />)

    expect(screen.getAllByRole('textbox')[0]).toBeDisabled()
  })

  it('handles nullish value and completed value without completion handler', () => {
    const onChange = jest.fn()
    render(
      <OneTimePassword
        value={undefined as unknown as string}
        onChange={onChange}
      />,
    )

    expect(screen.getAllByRole('textbox')[0]).toHaveValue('')
  })

  it('provides empty values for missing hook digits', () => {
    render(<HookProbe />)

    expect(screen.getByLabelText('first')).toHaveValue('1')
    expect(screen.getByLabelText('second')).toHaveValue('')
  })
})
