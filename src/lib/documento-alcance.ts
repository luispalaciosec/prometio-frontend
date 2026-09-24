import type { DocumentoAlcance } from "@/types/documento-alcance"

export function generacionEnCurso(doc: DocumentoAlcance | null | undefined): boolean {
  const estado = doc?.generacion_ia_estado
  return estado === "pendiente" || estado === "generando"
}

/** Backend deja `null` cuando el documento se creó con `generar_ia=false`. */
export function documentoSinGeneracionIa(doc: DocumentoAlcance | null | undefined): boolean {
  return doc?.generacion_ia_estado === null
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

/** Marcadores de alineación (compartidos con backend `texto_enriquecido`). */
const ALINEACION_A_MARCADOR: Record<string, string> = {
  center: "§c§",
  right: "§r§",
  justify: "§j§",
}

const MARCADOR_A_ALINEACION: Record<string, string> = {
  "§c§": "center",
  "§r§": "right",
  "§j§": "justify",
}

function inlineMarkdown(value: string): string {
  let s = escapeHtml(value)
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  s = s.replace(/_(.+?)_/g, "<em>$1</em>")
  return s
}

function leerAlineacionCss(el: HTMLElement): string | null {
  const directo = el.style.textAlign
  if (directo && directo !== "left" && directo !== "start") {
    return directo
  }
  const attr = el.getAttribute("style") ?? ""
  const match = /text-align:\s*(center|right|justify|left)/i.exec(attr)
  if (match && match[1] !== "left") {
    return match[1].toLowerCase()
  }
  return null
}

function prefijoAlineacion(align: string | null): string {
  if (!align || align === "left") {
    return ""
  }
  const marcador = ALINEACION_A_MARCADOR[align]
  return marcador ? `${marcador}\n` : ""
}

function estiloAlineacionHtml(align: string | null): string {
  if (!align || align === "left") {
    return ""
  }
  return ` style="text-align: ${align}"`
}

function esLineaTabla(linea: string): boolean {
  const t = linea.trim()
  return t.startsWith("|") && t.endsWith("|")
}

function esSeparadorTabla(linea: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(linea.trim())
}

function celdasTabla(linea: string): string[] {
  return linea
    .trim()
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim())
}

function bloqueEsTabla(lineas: string[]): boolean {
  if (lineas.length < 2 || !lineas.every(esLineaTabla)) {
    return false
  }
  return esSeparadorTabla(lineas[1])
}

function tablaMarkdownAHtml(lineas: string[]): string {
  const filas = lineas.filter((_, index) => index !== 1)
  const filasHtml = filas
    .map((linea, index) => {
      const celdas = celdasTabla(linea)
        .map((celda) => {
          const tag = index === 0 ? "th" : "td"
          return `<${tag}><p>${inlineMarkdown(celda)}</p></${tag}>`
        })
        .join("")
      return `<tr>${celdas}</tr>`
    })
    .join("")
  return `<table class="doc-alcance-tabla"><tbody>${filasHtml}</tbody></table>`
}

function separarMarcadorAlineacion(lineas: string[]): { align: string | null; lineas: string[] } {
  if (lineas.length === 0) {
    return { align: null, lineas }
  }
  const primera = lineas[0].trim()
  if (MARCADOR_A_ALINEACION[primera]) {
    return { align: MARCADOR_A_ALINEACION[primera], lineas: lineas.slice(1) }
  }
  for (const [marcador, align] of Object.entries(MARCADOR_A_ALINEACION)) {
    if (primera.startsWith(`${marcador} `)) {
      return {
        align,
        lineas: [primera.slice(marcador.length + 1), ...lineas.slice(1)],
      }
    }
  }
  return { align: null, lineas }
}

/** Texto guardado (IA o markdown liviano) → HTML para TipTap. */
export function textoDocumentoAHtml(value: string | null | undefined): string {
  if (!value?.trim()) {
    return ""
  }
  const trimmed = value.trim()
  if (/^<(p|h[1-6]|ul|ol|table)\b/i.test(trimmed)) {
    return trimmed
  }
  const bloques = trimmed.replace(/\r\n/g, "\n").split(/\n{2,}/)
  return bloques
    .map((bloque) => {
      const lineas = bloque.split("\n").filter((linea) => linea.length > 0)
      if (lineas.length === 0) {
        return ""
      }
      const { align, lineas: lineasContenido } = separarMarcadorAlineacion(lineas)
      if (bloqueEsTabla(lineasContenido)) {
        return tablaMarkdownAHtml(lineasContenido)
      }
      const viñetas = lineasContenido.every((linea) => /^[-•*]\s+/.test(linea))
      if (viñetas) {
        const items = lineasContenido
          .map((linea) => `<li>${inlineMarkdown(linea.replace(/^[-•]\s+/, ""))}</li>`)
          .join("")
        return `<ul>${items}</ul>`
      }
      const numeradas = lineasContenido.every((linea) => /^\d+[.)]\s+/.test(linea))
      if (numeradas) {
        const items = lineasContenido
          .map((linea) => `<li>${inlineMarkdown(linea.replace(/^\d+[.)]\s+/, ""))}</li>`)
          .join("")
        return `<ol>${items}</ol>`
      }
      if (lineasContenido.length === 1 && /^#\s+/.test(lineasContenido[0])) {
        return `<h2${estiloAlineacionHtml(align)}>${inlineMarkdown(lineasContenido[0].replace(/^#\s+/, ""))}</h2>`
      }
      return `<p${estiloAlineacionHtml(align)}>${lineasContenido.map((linea) => inlineMarkdown(linea)).join("<br>")}</p>`
    })
    .join("")
}

function inlineHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ""
  }
  if (!(node instanceof HTMLElement)) {
    return Array.from(node.childNodes).map(inlineHtml).join("")
  }
  const inner = Array.from(node.childNodes).map(inlineHtml).join("")
  switch (node.tagName.toLowerCase()) {
    case "strong":
    case "b":
      return inner ? `**${inner}**` : ""
    case "em":
    case "i":
      return inner ? `_${inner}_` : ""
    case "br":
      return "\n"
    case "p":
      return inner
    default:
      return inner
  }
}

function serializarBloqueTexto(el: HTMLElement, contenido: string): string {
  const align = leerAlineacionCss(el)
  const prefijo = prefijoAlineacion(align)
  return contenido ? `${prefijo}${contenido}\n\n` : ""
}

function serializarTabla(table: HTMLElement): string {
  const filas = Array.from(table.querySelectorAll("tr"))
  if (filas.length === 0) {
    return ""
  }
  const lineas: string[] = []
  filas.forEach((tr, index) => {
    const celdas = Array.from(tr.querySelectorAll("th,td"))
    const textoCeldas = celdas
      .map((celda) => Array.from(celda.childNodes).map(inlineHtml).join("").replace(/\n+/g, " ").trim())
      .join(" | ")
    lineas.push(`| ${textoCeldas} |`)
    if (index === 0) {
      lineas.push(`| ${celdas.map(() => "---").join(" | ")} |`)
    }
  })
  return `${lineas.join("\n")}\n\n`
}

function serializarLista(el: HTMLElement, numerada: boolean): string {
  const items = Array.from(el.children).filter(
    (n): n is HTMLElement => n instanceof HTMLElement && n.tagName.toLowerCase() === "li",
  )
  if (items.length === 0) {
    return ""
  }
  const lineas = items.map((li, index) => {
    const texto = Array.from(li.childNodes).map(inlineHtml).join("").replace(/\n+/g, " ").trim()
    const prefijo = numerada ? `${index + 1}. ` : "• "
    return `${prefijo}${texto}`
  })
  return `${lineas.join("\n")}\n\n`
}

function walkHtml(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ""
  }
  if (!(node instanceof HTMLElement)) {
    return Array.from(node.childNodes).map(walkHtml).join("")
  }
  const tag = node.tagName.toLowerCase()
  const inner = Array.from(node.childNodes).map(walkHtml).join("")
  switch (tag) {
    case "strong":
    case "b":
      return inner ? `**${inner}**` : ""
    case "h1":
    case "h2":
    case "h3": {
      const titulo = Array.from(node.childNodes).map(inlineHtml).join("").trim()
      return titulo ? serializarBloqueTexto(node, `# ${titulo}`) : ""
    }
    case "p": {
      const parrafo = Array.from(node.childNodes).map(inlineHtml).join("").trim()
      return serializarBloqueTexto(node, parrafo)
    }
    case "br":
      return "\n"
    case "ul":
      return serializarLista(node, false)
    case "ol":
      return serializarLista(node, true)
    case "table":
      return serializarTabla(node)
    case "li":
      return Array.from(node.childNodes).map(inlineHtml).join("").trim()
    default:
      return inner
  }
}

function walkHtmlDocumento(body: HTMLElement): string {
  return Array.from(body.childNodes)
    .map((nodo) => {
      if (nodo instanceof HTMLElement && nodo.tagName.toLowerCase() === "table") {
        return serializarTabla(nodo)
      }
      return walkHtml(nodo)
    })
    .join("")
}

/** HTML de TipTap → texto que el PDF (pre-line) puede imprimir. */
export function htmlATextoDocumento(html: string): string | null {
  if (typeof DOMParser === "undefined") {
    const plain = html.replace(/<[^>]+>/g, "").trim()
    return plain === "" ? null : plain
  }
  const doc = new DOMParser().parseFromString(html, "text/html")
  const texto = walkHtmlDocumento(doc.body).replace(/\n{3,}/g, "\n\n").trim()
  return texto === "" ? null : texto
}
