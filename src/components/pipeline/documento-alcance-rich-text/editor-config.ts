import StarterKit from "@tiptap/starter-kit"

export const documentoAlcanceEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    blockquote: false,
    codeBlock: false,
    code: false,
    horizontalRule: false,
    italic: false,
    strike: false,
    link: false,
  }),
]

export const editorSurfaceClassName =
  "rounded-lg border border-input px-2.5 py-2 text-ui [&_.tiptap]:outline-none [&_.tiptap_h2]:mb-2 [&_.tiptap_h2]:text-section [&_.tiptap_h3]:mb-1.5 [&_.tiptap_h3]:text-ui-medium [&_.tiptap_p]:my-1 [&_.tiptap_ul]:my-1 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:my-1 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_strong]:font-medium"
