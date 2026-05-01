import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileDropzone from './FileDropzone'

describe('FileDropzone', () => {
  it('renders copy and invokes action with custom label', async () => {
    const onAction = jest.fn()
    const user = userEvent.setup()

    const { container } = render(
      <FileDropzone
        title="Upload fil"
        description={<span>PDF eller DOCX</span>}
        actionLabel="Upload"
        onAction={onAction}
        className="extra"
      />,
    )

    expect(screen.getByText('Upload fil')).toBeInTheDocument()
    expect(screen.getByText('PDF eller DOCX')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass(
      'fileDropzone',
      'extra',
    )

    await user.click(screen.getByRole('button', { name: 'Upload' }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('uses default action label and omits optional description', () => {
    render(<FileDropzone title="Bilag" />)

    expect(screen.getByRole('button', { name: 'Vælg fil' })).toBeInTheDocument()
  })
})
