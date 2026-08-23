const HEX6 = /^#[0-9A-Fa-f]{6}$/

/** Lee un token de tema. Solo devuelve hex si el token está en #RRGGBB (el input nativo lo exige). */
export function readThemeHex(name: `--${string}`): string | null {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return HEX6.test(raw) ? raw : null
}

function aplicarToken(name: `--${string}`, value: string | null | undefined) {
  const root = document.documentElement
  if (value) {
    root.style.setProperty(name, value)
    return
  }
  if (value === null) {
    root.style.removeProperty(name)
  }
}

/**
 * Aplica colores de marca de GET /organizacion.
 * primario → --primary, secundario → --secondary,
 * terciario → --highlight, cuaternario → --sidebar.
 * Defaults en index.css (paleta D). Sin hex en componentes.
 */
export function applyOrganizationTheme(colors: {
  primary?: string | null
  secondary?: string | null
  tertiary?: string | null
  quaternary?: string | null
}) {
  aplicarToken("--primary", colors.primary)
  aplicarToken("--secondary", colors.secondary)
  aplicarToken("--highlight", colors.tertiary)
  aplicarToken("--sidebar", colors.quaternary)
}

export function clearOrganizationTheme() {
  const root = document.documentElement
  root.style.removeProperty("--primary")
  root.style.removeProperty("--secondary")
  root.style.removeProperty("--highlight")
  root.style.removeProperty("--sidebar")
}
