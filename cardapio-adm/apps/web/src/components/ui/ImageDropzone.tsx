import { useCallback, useRef, useState, type DragEvent } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { fileToCompressedDataUrl } from '@/utils/image'

interface ImageDropzoneProps {
  label: string
  hint: string
  value?: string
  onChange: (dataUrl: string) => void
  onClear: () => void
  maxEdge?: number
  className?: string
  previewClassName?: string
  compact?: boolean
}

export function ImageDropzone({
  label,
  hint,
  value,
  onChange,
  onClear,
  maxEdge = 1200,
  className,
  previewClassName,
  compact = false,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      setError(null)
      setBusy(true)
      try {
        const dataUrl = await fileToCompressedDataUrl(file, { maxEdge, quality: 0.82 })
        onChange(dataUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar a imagem')
      } finally {
        setBusy(false)
      }
    },
    [maxEdge, onChange],
  )

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragging(false)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void processFile(e.dataTransfer.files?.[0] ?? null)
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <p className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
        {label}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        disabled={busy}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[10px] border border-dashed px-4 transition-colors',
          compact ? 'min-h-[140px] py-5' : 'min-h-[200px] py-8',
          dragging
            ? 'border-accent bg-accent-muted/40 text-text'
            : 'border-border bg-transparent text-muted hover:border-muted hover:text-text',
          busy && 'opacity-70',
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              className={cn('max-h-full max-w-full object-contain', previewClassName)}
            />
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onClear()
                }
              }}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-bg/80 px-2 py-1 text-[11px] text-muted backdrop-blur-sm hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
              Remover
            </span>
          </>
        ) : (
          <>
            <Upload className="mb-3 h-7 w-7" strokeWidth={1.5} />
            <span className="text-sm">{busy ? 'Processando…' : hint}</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            e.target.value = ''
            void processFile(file)
          }}
        />
      </button>
      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
