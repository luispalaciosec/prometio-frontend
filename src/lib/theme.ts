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
 * Colores de entregables (PDF cotización, documentos, widget vía API).
 * No pisan la UI del CRM — ver ADR-022.
 */
export function applyOrganizationBrandTheme(colors: {
  primary?: string | null
  secondary?: string | null
  tertiary?: string | null
  quaternary?: string | null
}) {
  aplicarToken("--brand-primary", colors.primary)
  aplicarToken("--brand-secondary", colors.secondary)
  aplicarToken("--brand-highlight", colors.tertiary)
  aplicarToken("--brand-sidebar", colors.quaternary)
}

export function clearOrganizationBrandTheme() {
  const root = document.documentElement
  root.style.removeProperty("--brand-primary")
  root.style.removeProperty("--brand-secondary")
  root.style.removeProperty("--brand-highlight")
  root.style.removeProperty("--brand-sidebar")
}

/** @deprecated Usar applyOrganizationBrandTheme */
export const applyOrganizationTheme = applyOrganizationBrandTheme

/** @deprecated Usar clearOrganizationBrandTheme */
export const clearOrganizationTheme = clearOrganizationBrandTheme
