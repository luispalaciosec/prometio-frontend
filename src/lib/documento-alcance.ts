import type { DocumentoAlcance } from "@/types/documento-alcance"

export function generacionEnCurso(doc: DocumentoAlcance | null | undefined): boolean {
  const estado = doc?.generacion_ia_estado
  return estado === "pendiente" || estado === "generando"
}

export function documentoEditable(doc: DocumentoAlcance | null | undefined): boolean {
  if (!doc || generacionEnCurso(doc)) {
    return false
  }
  return doc.estado === "borrador" || doc.estado === "rechazado"
}

export function documentoUsable(doc: DocumentoAlcance): boolean {
  if (doc.generacion_ia_estado === "fallido" && !doc.objetivo && !doc.alcance_funcional) {
    return false
  }
  return doc.generacion_ia_estado !== "pendiente"
}

export function documentoVigente(docs: DocumentoAlcance[]): DocumentoAlcance | null {
  if (docs.length === 0) {
    return null
  }
  const aprobado = docs.filter((row) => row.estado === "aprobado")
  const pool = aprobado.length > 0 ? aprobado : docs
  return [...pool].sort((a, b) => {
    if (b.version !== a.version) {
      return b.version - a.version
    }
    return b.created_at.localeCompare(a.created_at)
  })[0]
}

export function ordenarVersiones(docs: DocumentoAlcance[]): DocumentoAlcance[] {
  return [...docs].sort((a, b) => {
    if (a.version !== b.version) {
      return a.version - b.version
    }
    return a.created_at.localeCompare(b.created_at)
  })
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function inlineMarkdown(value: string): string {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
}

/** Texto guardado (IA o markdown liviano) → HTML para TipTap. */
export function textoDocumentoAHtml(value: string | null | undefined): string {
  if (!value?.trim()) {
    return ""
  }
  const trimmed = value.trim()
  if (/^<(p|h[1-6]|ul|ol)\b/i.test(trimmed)) {
    return trimmed
  }
  const bloques = trimmed.replace(/\r\n/g, "\n").split(/\n{2,}/)
  return bloques
    .map((bloque) => {
      const lineas = bloque.split("\n").filter((linea) => linea.length > 0)
      if (lineas.length === 0) {
        return ""
      }
      const viñetas = lineas.every((linea) => /^[-•*]\s+/.test(linea))
      if (viñetas) {
        const items = lineas
          .map((linea) => `<li>${inlineMarkdown(linea.replace(/^[-•*]\s+/, ""))}</li>`)
          .join("")
        return `<ul>${items}</ul>`
      }
      const numeradas = lineas.every((linea) => /^\d+[.)]\s+/.test(linea))
      if (numeradas) {
        const items = lineas
          .map((linea) => `<li>${inlineMarkdown(linea.replace(/^\d+[.)]\s+/, ""))}</li>`)
          .join("")
        return `<ol>${items}</ol>`
      }
      if (lineas.length === 1 && /^#\s+/.test(lineas[0])) {
        return `<h2>${inlineMarkdown(lineas[0].replace(/^#\s+/, ""))}</h2>`
      }
      return `<p>${lineas.map((linea) => inlineMarkdown(linea)).join("<br>")}</p>`
    })
    .join("")
}

function walkHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ""
  }
  if (!(node instanceof HTMLElement)) {
    return Array.from(node.childNodes).map(walkHtml).join("")
  }
  const inner = Array.from(node.childNodes).map(walkHtml).join("")
  switch (node.tagName.toLowerCase()) {
    case "strong":
    case "b":
      return inner ? `**${inner}**` : ""
    case "h1":
    case "h2":
    case "h3":
      return inner.trim() ? `# ${inner.trim()}\n\n` : ""
    case "p":
      return inner.trim() ? `${inner.trim()}\n\n` : ""
    case "br":
      return "\n"
    case "li":
      return `• ${inner.trim()}\n`
    case "ul":
    case "ol":
      return `\n${inner}`
    default:
      return inner
  }
}

/** HTML de TipTap → texto que el PDF (pre-line) puede imprimir. */
export function htmlATextoDocumento(html: string): string | null {
  if (typeof DOMParser === "undefined") {
    const plain = html.replace(/<[^>]+>/g, "").trim()
    return plain === "" ? null : plain
  }
  const doc = new DOMParser().parseFromString(html, "text/html")
  const texto = walkHtml(doc.body).replace(/\n{3,}/g, "\n\n").trim()
  return texto === "" ? null : texto
}
