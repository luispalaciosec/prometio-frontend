import { useEffect, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"

import { CopilotoPanel } from "@/components/documento-alcance-wizard/CopilotoPanel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { htmlATextoDocumento, textoDocumentoAHtml } from "@/lib/documento-alcance"
import { cn } from "@/lib/utils"
import type { RegenerarSeccionResponse, SeccionRegenerable } from "@/types/documento-alcance"

import { documentoAlcanceEditorExtensions, editorSurfaceClassName } from "./editor-config"
import { contarPalabras, DocumentoAlcanceEditorToolbar } from "./DocumentoAlcanceEditorToolbar"

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const handler = () => setReduce(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduce
}

export function DocumentoAlcanceEditorModal({
  open,
  onOpenChange,
  title,
  value,
  onChange,
  disabled,
  placeholder,
  returnFocusRef,
  copiloto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  value: string | null
  onChange: (next: string | null) => void
  disabled?: boolean
  placeholder?: string
  returnFocusRef: React.RefObject<HTMLElement | null>
  copiloto?: {
    documentoId: string
    seccion: SeccionRegenerable
    disabled?: boolean
    onAceptar: (propuesta: RegenerarSeccionResponse) => void
  }
}) {
  const reduceMotion = usePrefersReducedMotion()

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled && open,
    extensions: documentoAlcanceEditorExtensions,
    content: textoDocumentoAHtml(value),
    onUpdate: ({ editor: instance }) => {
      onChange(htmlATextoDocumento(instance.getHTML()))
    },
  })

  useEffect(() => {
    editor?.setEditable(!disabled && open)
  }, [disabled, open, editor])

  useEffect(() => {
    if (!open || !editor) {
      return
    }
    const html = textoDocumentoAHtml(value)
    if (html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false })
    }
  }, [open, value, editor])

  useEffect(() => {
    if (open && editor) {
      const id = window.requestAnimationFrame(() => editor.commands.focus("end"))
      return () => window.cancelAnimationFrame(id)
    }
    return undefined
  }, [open, editor])

  const palabras = contarPalabras(value)
  const vacio = !value?.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92vh,920px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl",
          "max-sm:fixed max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
          !reduceMotion && "dashboard-detalle-flip",
        )}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusRef.current?.focus()
        }}
      >
        <div className="border-b border-border px-4 py-3 sm:px-6">
          <DialogHeader>
            <DialogTitle className="text-section">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              Editor ampliado del documento de alcance. Los cambios se guardan automáticamente.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_minmax(240px,300px)]">
          <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-6">
            <DocumentoAlcanceEditorToolbar editor={editor} disabled={disabled} showLabels />
            <div
              className={cn(
                editorSurfaceClassName,
                "min-h-[min(52vh,420px)] flex-1 resize-y overflow-auto [&_.tiptap]:min-h-[min(48vh,380px)]",
                disabled && "cursor-not-allowed bg-input/50 opacity-50",
              )}
            >
              <EditorContent editor={editor} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-micro text-muted-foreground">
              <span>{palabras === 1 ? "1 palabra" : `${palabras} palabras`}</span>
              {vacio && placeholder ? <span className="text-kicker">{placeholder}</span> : null}
            </div>
          </div>

          {copiloto ? (
            <div className="border-t border-border p-4 lg:border-t-0 lg:border-l lg:overflow-y-auto">
              <CopilotoPanel
                documentoId={copiloto.documentoId}
                seccion={copiloto.seccion}
                disabled={copiloto.disabled ?? disabled}
                onAceptar={copiloto.onAceptar}
              />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
