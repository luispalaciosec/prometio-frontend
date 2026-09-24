import TextAlign from "@tiptap/extension-text-align"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import StarterKit from "@tiptap/starter-kit"

export const documentoAlcanceEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    blockquote: false,
    codeBlock: false,
    code: false,
    horizontalRule: false,
    strike: false,
    link: false,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
    alignments: ["left", "center", "right", "justify"],
    defaultAlignment: "left",
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: { class: "doc-alcance-tabla" },
  }),
  TableRow,
  TableHeader,
  TableCell,
]

export const editorSurfaceClassName =
  "rounded-lg border border-input px-2.5 py-2 text-ui [&_.tiptap]:outline-none [&_.tiptap_h2]:mb-2 [&_.tiptap_h2]:text-section [&_.tiptap_h3]:mb-1.5 [&_.tiptap_h3]:text-ui-medium [&_.tiptap_p]:my-1 [&_.tiptap_ul]:my-2 [&_.tiptap_ul]:list-outside [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:my-2 [&_.tiptap_ol]:list-outside [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_li]:my-0.5 [&_.tiptap_li_p]:my-0 [&_.tiptap_strong]:font-medium [&_.tiptap_em]:italic [&_.tiptap_table.doc-alcance-tabla]:my-3 [&_.tiptap_table.doc-alcance-tabla]:w-full [&_.tiptap_table.doc-alcance-tabla]:border-collapse [&_.tiptap_table.doc-alcance-tabla_td]:border [&_.tiptap_table.doc-alcance-tabla_td]:border-border [&_.tiptap_table.doc-alcance-tabla_td]:px-2 [&_.tiptap_table.doc-alcance-tabla_td]:py-1.5 [&_.tiptap_table.doc-alcance-tabla_td]:align-top [&_.tiptap_table.doc-alcance-tabla_th]:border [&_.tiptap_table.doc-alcance-tabla_th]:border-border [&_.tiptap_table.doc-alcance-tabla_th]:bg-muted/60 [&_.tiptap_table.doc-alcance-tabla_th]:px-2 [&_.tiptap_table.doc-alcance-tabla_th]:py-1.5 [&_.tiptap_table.doc-alcance-tabla_th]:text-left [&_.tiptap_table.doc-alcance-tabla_th]:text-ui-medium"
