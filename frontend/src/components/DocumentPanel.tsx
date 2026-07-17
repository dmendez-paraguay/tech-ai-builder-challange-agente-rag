import { FileCheck2, FileUp, LoaderCircle, Replace } from "lucide-react"
import { useRef, useState, type ChangeEvent, type DragEvent } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DocumentPanelProps {
  filename: string | null
  isUploading: boolean
  onUpload: (file: File) => Promise<void>
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

export function DocumentPanel({ filename, isUploading, onUpload }: DocumentPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const selectFile = async (file?: File) => {
    if (!file) return
    if (!isPdf(file)) {
      setLocalError("Seleccioná un archivo PDF.")
      return
    }
    setLocalError(null)
    await onUpload(file)
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    void selectFile(event.target.files?.[0])
    event.target.value = ""
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    void selectFile(event.dataTransfer.files[0])
  }

  return (
    <section className="flex h-full flex-col" aria-labelledby="document-title">
      <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
        <p className="eyebrow">Contexto</p>
        <h2 id="document-title" className="mt-1 text-lg font-semibold tracking-[-0.02em]">
          Documento activo
        </h2>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <div
          className={cn(
            "group flex min-h-64 flex-col items-center justify-center border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] p-6 text-center transition-colors",
            isDragging && "border-[var(--accent)] bg-[var(--accent-wash)]",
          )}
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="mb-5 grid size-14 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
            {isUploading ? (
              <LoaderCircle className="size-6 animate-spin text-[var(--accent)]" aria-hidden="true" />
            ) : filename ? (
              <FileCheck2 className="size-6 text-[var(--accent)]" aria-hidden="true" />
            ) : (
              <FileUp className="size-6 text-[var(--ink-muted)]" aria-hidden="true" />
            )}
          </div>

          <p className="font-semibold">
            {isUploading ? "Indexando documento" : filename ? filename : "Soltá tu PDF acá"}
          </p>
          <p className="mt-2 max-w-56 text-sm leading-6 text-[var(--ink-muted)]">
            {isUploading
              ? "Generamos los embeddings y preparamos el índice."
              : filename
                ? "El contenido está listo para responder preguntas."
                : "O elegí un archivo desde tu equipo."}
          </p>

          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleInput}
            disabled={isUploading}
            aria-label="Seleccionar documento PDF"
          />
          <Button
            className="mt-6"
            type="button"
            variant={filename ? "secondary" : "primary"}
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {filename ? <Replace className="size-4" /> : <FileUp className="size-4" />}
            {filename ? "Reemplazar PDF" : "Elegir PDF"}
          </Button>
          {localError && <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">{localError}</p>}
        </div>

        <div className="mt-auto border-t border-[var(--border)] pt-5">
          <p className="text-xs leading-5 text-[var(--ink-muted)]">
            Los embeddings se generan localmente. Al reemplazar el PDF, las próximas respuestas usarán el nuevo documento.
          </p>
        </div>
      </div>
    </section>
  )
}
