import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { Button } from "@/components/ui/button"
import { htmlATextoDocumento, textoDocumentoAHtml } from "@/lib/documento-alcance"
import { cn } from "@/lib/utils"

export function DocumentoAlcanceRichText({
  value,
  onChange,
  disabled = false,
  placeholder,
}: {
  value: string | null
  onChange: (next: string | null) => void
  disabled?: boolean
  placeholder?: string
}) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        italic: false,
        strike: false,
        underline: false,
        link: false,
      }),
    ],
    content: textoDocumentoAHtml(value),
    onUpdate: ({ editor: instance }) => {
      onChange(htmlATextoDocumento(instance.getHTML()))
    },
  })

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  const vacio = !value?.trim()

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={disabled || !editor}
          aria-pressed={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          Título
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={disabled || !editor}
          aria-pressed={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Negrita
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={disabled || !editor}
          aria-pressed={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Lista
        </Button>
      </div>
      <div
        className={cn(
          "min-h-28 rounded-lg border border-input px-2.5 py-2 text-ui",
          "[&_.tiptap]:min-h-24 [&_.tiptap]:outline-none",
          "[&_.tiptap_h2]:mb-2 [&_.tiptap_h2]:text-section",
          "[&_.tiptap_p]:my-1",
          "[&_.tiptap_ul]:my-1 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5",
          "[&_.tiptap_ol]:my-1 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5",
          "[&_.tiptap_strong]:font-medium",
          disabled && "cursor-not-allowed bg-input/50 opacity-50",
        )}
      >
        <EditorContent editor={editor} />
      </div>
      {vacio && placeholder ? <p className="text-kicker">{placeholder}</p> : null}
    </div>
  )
}
