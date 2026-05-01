import { act, fireEvent, render, screen } from '@testing-library/react'
import { Button } from 'react-aria-components'
import { MyToastRegion, queue, showToast, Toast } from './Toast'

function mockQueuedToast(content: Parameters<typeof showToast>[0]) {
  return {
    key: `toast-${content.title}`,
    content,
  } as Parameters<typeof Toast>[0]['toast']
}

function mockToastState() {
  return {
    close: jest.fn(),
  } as unknown as Parameters<typeof Toast>[0]['state']
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    queue.clear()
  })

  afterEach(() => {
    act(() => {
      queue.clear()
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('normalizes variants through showToast', () => {
    act(() => {
      showToast({ title: 'Negativ', type: 'negative' })
      showToast({ title: 'Positiv', type: 'positive' })
      showToast({ title: 'Advarsel', type: 'warning' })
      showToast({ title: 'Info', type: 'info' })
      showToast({ title: 'Eksplicit', variant: 'danger' })
    })

    render(<MyToastRegion />)

    expect(screen.getByText('Negativ').closest('.toast')).toHaveClass(
      'toast--danger',
    )
    expect(screen.getByText('Positiv').closest('.toast')).toHaveClass(
      'toast--success',
    )
    expect(screen.getByText('Advarsel').closest('.toast')).toHaveClass(
      'toast--warning',
    )
    expect(screen.getByText('Info')).toBeInTheDocument()
    expect(screen.getByText('Eksplicit').closest('.toast')).toHaveClass(
      'toast--danger',
    )
  })

  it('renders title, description, actions, class, success variant, and closes by button', async () => {
    const state = mockToastState()

    render(
      <Toast
        toast={mockQueuedToast({
          title: 'Gemt',
          description: 'Ændringerne er gemt',
          actions: <Button>Fortryd</Button>,
          variant: 'success',
          className: 'extra',
        })}
        state={state}
      />,
    )

    expect(screen.getByText('Gemt')).toBeInTheDocument()
    expect(screen.getByText('Ændringerne er gemt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fortryd' })).toBeInTheDocument()
    expect(screen.getByText('Gemt').closest('.toast')).toHaveClass(
      'toast',
      'toast--success',
      'extra',
    )

    expect(
      screen.getByRole('button', { name: 'Close notification' }),
    ).toBeInTheDocument()
  })

  it('renders danger, warning, and default icon/variant branches', () => {
    const state = mockToastState()

    render(
      <>
        <Toast toast={mockQueuedToast({ title: 'Fare', variant: 'danger' })} state={state} />
        <Toast toast={mockQueuedToast({ title: 'Pas på', variant: 'warning' })} state={state} />
        <Toast toast={mockQueuedToast({ title: 'Normal' })} state={state} />
      </>,
    )

    expect(screen.getByText('Fare').closest('.toast')).toHaveClass(
      'toast--danger',
    )
    expect(screen.getByText('Pas på').closest('.toast')).toHaveClass(
      'toast--warning',
    )
    expect(screen.getByText('Normal').closest('.toast')).not.toHaveClass(
      'toast--danger',
    )
  })

  it('closes after timeout and enforces minimum timeout', () => {
    const state = mockToastState()

    render(
      <Toast
        toast={mockQueuedToast({ title: 'Kort', timeout: 1 })}
        state={state}
      />,
    )

    act(() => {
      jest.advanceTimersByTime(4999)
    })
    expect(state.close).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(state.close).toHaveBeenCalledWith('toast-Kort')
  })

  it('pauses and resumes timeout on hover', async () => {
    const state = mockToastState()
    render(
      <Toast
        toast={mockQueuedToast({ title: 'Pause', timeout: 5000 })}
        state={state}
      />,
    )

    const toast = screen.getByText('Pause').closest('.toast') as HTMLElement
    act(() => {
      jest.advanceTimersByTime(100)
    })
    act(() => {
      fireEvent.mouseEnter(toast)
    })

    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(state.close).not.toHaveBeenCalled()

    act(() => {
      fireEvent.mouseLeave(toast)
    })
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(state.close).toHaveBeenCalledWith('toast-Pause')
  })

  it('renders null for an empty region and visible queued toasts otherwise', () => {
    const { container, rerender } = render(<MyToastRegion />)

    expect(container).toBeEmptyDOMElement()

    act(() => {
      showToast({ title: 'Fra køen' })
    })
    rerender(<MyToastRegion />)

    expect(screen.getByText('Fra køen')).toBeInTheDocument()
  })
})
