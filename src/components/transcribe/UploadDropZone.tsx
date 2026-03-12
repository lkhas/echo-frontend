import { Upload, FileAudio, X } from "lucide-react";

interface Props {
  file: File | null
  dragOver: boolean
  setDragOver: (v: boolean) => void
  loadFile: (f: File) => void
  removeFile: () => void
  fileRef: React.RefObject<HTMLInputElement>
}

function formatBytes(b: number) {
  return b < 1024 * 1024
    ? `${(b / 1024).toFixed(1)} KB`
    : `${(b / (1024 ** 2)).toFixed(1)} MB`
}

export const UploadDropZone = ({
  file,
  dragOver,
  setDragOver,
  loadFile,
  removeFile,
  fileRef
}: Props) => {

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const f = e.dataTransfer.files[0]
    if (f) loadFile(f)
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => !file && fileRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
      ${dragOver ? "border-violet-500 bg-violet-500/5" : "border-border"}
      `}
    >
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
      />

      {!file ? (
        <>
          <Upload className="mx-auto mb-3 text-muted-foreground" />

          <p className="font-medium">Drop audio file here</p>

          <p className="text-xs text-muted-foreground">
            MP3 · WAV · M4A · OGG · FLAC
          </p>
        </>
      ) : (
        <div className="flex items-center gap-3">

          <FileAudio className="text-green-500" />

          <div className="flex-1 text-left">
            <p className="font-medium truncate">{file.name}</p>

            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </p>
          </div>

          <button onClick={(e) => {
            e.stopPropagation()
            removeFile()
          }}>
            <X />
          </button>

        </div>
      )}
    </div>
  )
}