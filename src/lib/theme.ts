/**
 * Applies organization brand colors as CSS variables.
 * Wired to GET /organizacion (`color_primario` / `color_secundario`).
 * Defaults live in index.css (paleta D). Do not hardcode hex in components.
 */
export function applyOrganizationTheme(colors: {
  primary?: string | null
  secondary?: string | null
}) {
  const root = document.documentElement
  if (colors.primary) {
    root.style.setProperty("--primary", colors.primary)
  } else if (colors.primary === null) {
    root.style.removeProperty("--primary")
  }
  if (colors.secondary) {
    root.style.setProperty("--secondary", colors.secondary)
  } else if (colors.secondary === null) {
    root.style.removeProperty("--secondary")
  }
}

export function clearOrganizationTheme() {
  const root = document.documentElement
  root.style.removeProperty("--primary")
  root.style.removeProperty("--secondary")
}
