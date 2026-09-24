import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import { Maximize2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { htmlATextoDocumento, textoDocumentoAHtml } from "@/lib/documento-alcance"
import { cn } from "@/lib/utils"
import type { RegenerarSeccionResponse, SeccionRegenerable } from "@/types/documento-alcance"

import { documentoAlcanceEditorExtensions, editorSurfaceClassName } from "./editor-config"
import { contarPalabras, DocumentoAlcanceEditorToolbar } from "./DocumentoAlcanceEditorToolbar"
import { DocumentoAlcanceEditorModal } from "./DocumentoAlcanceEditorModal"

export function DocumentoAlcanceRichText({
  value,
  onChange,
  disabled = false,
  placeholder,
  label,
  copilotoSeccion,
  copiloto,
  onAmpliar,
}: {
  value: string | null
  onChange: (next: string | null) => void
  disabled?: boolean
  placeholder?: string
  /** Título en la ventana ampliada (p. ej. nombre del campo). */
  label?: string
  /** Sección del copiloto al abrir Ampliar (wizard). */
  copilotoSeccion?: SeccionRegenerable
  copiloto?: {
    documentoId: string
    disabled?: boolean
    onAceptar: (propuesta: RegenerarSeccionResponse) => void
  }
  /** Sincroniza la sección del copiloto lateral al abrir Ampliar. */
  onAmpliar?: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const ampliarRef = useRef<HTMLButtonElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: documentoAlcanceEditorExtensions,
    content: textoDocumentoAHtml(value),
    onUpdate: ({ editor: instance }) => {
      onChange(htmlATextoDocumento(instance.getHTML()))
    },
  })

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  useEffect(() => {
    if (!editor || modalOpen) {
      return
    }
    const html = textoDocumentoAHtml(value)
    const actual = editor.getHTML()
    if (html !== actual && !editor.isFocused) {
      editor.commands.setContent(html, { emitUpdate: false })
    }
  }, [value, editor, modalOpen])

  const vacio = !value?.trim()
  const tituloModal = label?.trim() || "Editar texto"

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <DocumentoAlcanceEditorToolbar editor={editor} disabled={disabled} className="flex-1" />
        <Button
          ref={ampliarRef}
          type="button"
          variant="outline"
          size="xs"
          disabled={disabled}
          className="shrink-0 gap-1"
          onClick={() => {
            onAmpliar?.()
            setModalOpen(true)
          }}
        >
          <Maximize2 className="size-3.5" strokeWidth={1.75} aria-hidden />
          Ampliar
        </Button>
      </div>
      <div
        className={cn(
          editorSurfaceClassName,
          "min-h-28 [&_.tiptap]:min-h-24",
          disabled && "cursor-not-allowed bg-input/50 opacity-50",
        )}
      >
        <EditorContent editor={editor} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {vacio && placeholder ? <p className="text-kicker text-muted-foreground">{placeholder}</p> : <span />}
        <span className="text-micro text-muted-foreground tabular-nums">
          {contarPalabras(value) === 1 ? "1 palabra" : `${contarPalabras(value)} palabras`}
        </span>
      </div>

      <DocumentoAlcanceEditorModal
        open={modalOpen}
        title={tituloModal}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        returnFocusRef={ampliarRef}
        onOpenChange={setModalOpen}
        onChange={onChange}
        copiloto={
          copiloto && copilotoSeccion
            ? {
                documentoId: copiloto.documentoId,
                seccion: copilotoSeccion,
                disabled: copiloto.disabled,
                onAceptar: copiloto.onAceptar,
              }
            : undefined
        }
      />
    </div>
  )
}
