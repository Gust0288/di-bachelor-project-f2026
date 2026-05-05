import { useRef } from 'react'
import ContentBox from '../../../components/ContentBox'
import FileDropzone from '../../../components/FileDropzone/FileDropzone'
import RadioCardGroup from '../../../components/RadioCardGroup/RadioCardGroup'
import { uploadDocument } from '../../../api/registration'

type AgreementStepProps = {
  sessionId: string
  overenskomstStatus: string
  onStatusChange: (value: string) => void
  overenskomstType: string
  onTypeChange: (value: string) => void
  documentId: string
  onDocumentIdChange: (id: string) => void
  isUploading: boolean
  onUploadingChange: (value: boolean) => void
}

export default function AgreementStep({
  sessionId,
  overenskomstStatus,
  onStatusChange,
  overenskomstType,
  onTypeChange,
  documentId,
  onDocumentIdChange,
  isUploading,
  onUploadingChange,
}: AgreementStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !sessionId) return
    onUploadingChange(true)
    try {
      const result = await uploadDocument(sessionId, file)
      onDocumentIdChange(result.document_id)
    } catch {
      // upload failed — leave documentId empty so validation catches it
    } finally {
      onUploadingChange(false)
    }
  }

  return (
    <>
      <ContentBox
        title="Overenskomst"
        description="Screeningen hjælper os med at afklare jeres nuværende overenskomstsituation inden indmeldelse."
      >
        <RadioCardGroup
          label="Har virksomheden en overenskomst?"
          options={[
            { value: 'nej', title: 'Nej', description: 'Virksomheden har ingen overenskomst.' },
            { value: 'ved_ikke', title: 'Ved ikke', description: 'Vi er usikre på vores overenskomstsituation.' },
            { value: 'ja', title: 'Ja', description: 'Virksomheden har en overenskomst.' },
          ]}
          value={overenskomstStatus}
          onChange={onStatusChange}
          isRequired
        />
      </ContentBox>

      {overenskomstStatus === 'ja' ? (
        <ContentBox title="Type af overenskomst">
          <RadioCardGroup
            label="Hvilken type overenskomst?"
            options={[
              { value: 'direkte', title: 'Direkte med et fagforbund' },
              { value: 'anden', title: 'Med en anden arbejdsgiverorganisation' },
            ]}
            value={overenskomstType}
            onChange={(value) => {
              onTypeChange(value)
              onDocumentIdChange('')
            }}
            isRequired
          />
        </ContentBox>
      ) : null}

      {overenskomstType === 'direkte' ? (
        <ContentBox
          title="Upload overenskomst"
          description="Upload jeres overenskomstdokument (PDF eller billede)."
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <FileDropzone
            title={
              isUploading
                ? 'Uploader...'
                : documentId
                  ? 'Dokument uploadet'
                  : 'Vælg overenskomstdokument'
            }
            description={
              documentId
                ? 'Dokumentet er klar. Du kan vælge et andet, hvis det var forkert.'
                : 'PDF eller billede (JPG, PNG)'
            }
            actionLabel={isUploading ? 'Uploader...' : documentId ? 'Skift fil' : 'Vælg fil'}
            onAction={() => fileInputRef.current?.click()}
          />
        </ContentBox>
      ) : null}
    </>
  )
}
