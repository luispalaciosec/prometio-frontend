import type { ReactNode } from "react"
import type { Editor } from "@tiptap/react"
import {
  Bold,
  Eraser,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function DocumentoAlcanceEditorToolbar({
  editor,
  disabled,
  className,
}: {
  editor: Editor | null
  disabled?: boolean
  className?: string
}) {
  const off = disabled || !editor

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1", className)}
      role="toolbar"
      aria-label="Formato del texto"
    >
      <ToolbarButton
        label="Título"
        disabled={off}
        pressed={editor?.isActive("heading", { level: 2 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-3.5" strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Título</span>
      </ToolbarButton>
      <ToolbarButton
        label="Subtítulo"
        disabled={off}
        pressed={editor?.isActive("heading", { level: 3 })}
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-3.5" strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Subtítulo</span>
      </ToolbarButton>
      <ToolbarButton
        label="Negrita"
        disabled={off}
        pressed={editor?.isActive("bold")}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Negrita</span>
      </ToolbarButton>
      <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" aria-hidden />
      <ToolbarButton
        label="Lista con viñetas"
        disabled={off}
        pressed={editor?.isActive("bulletList")}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" strokeWidth={1.75} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        disabled={off}
        pressed={editor?.isActive("orderedList")}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" strokeWidth={1.75} aria-hidden />
      </ToolbarButton>
      <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" aria-hidden />
      <ToolbarButton
        label="Deshacer"
        disabled={off || !editor?.can().undo()}
        onClick={() => editor?.chain().focus().undo().run()}
      >
        <Undo2 className="size-3.5" strokeWidth={1.75} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Rehacer"
        disabled={off || !editor?.can().redo()}
        onClick={() => editor?.chain().focus().redo().run()}
      >
        <Redo2 className="size-3.5" strokeWidth={1.75} aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        label="Limpiar formato"
        disabled={off}
        onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
      >
        <Eraser className="size-3.5" strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Limpiar</span>
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  label,
  children,
  disabled,
  pressed,
  onClick,
}: {
  label: string
  children: ReactNode
  disabled?: boolean
  pressed?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={cn("gap-1", pressed && "bg-muted")}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function contarPalabras(texto: string | null | undefined): number {
  const t = texto?.trim()
  if (!t) {
    return 0
  }
  return t.split(/\s+/).filter(Boolean).length
}
