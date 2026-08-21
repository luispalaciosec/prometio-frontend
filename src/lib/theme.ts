/**
 * Applies organization brand colors as CSS variables.
 * Wired to `organizacion.color_primario` / `color_secundario` once the API is ready.
 * Defaults live in index.css (paleta D). Do not hardcode hex in components.
 */
export function applyOrganizationTheme(colors: {
  primary?: string | null
  secondary?: string | null
}) {
  const root = document.documentElement
  if (colors.primary) {
    root.style.setProperty("--primary", colors.primary)
  }
  if (colors.secondary) {
    root.style.setProperty("--secondary", colors.secondary)
  }
}

export function clearOrganizationTheme() {
  const root = document.documentElement
  root.style.removeProperty("--primary")
  root.style.removeProperty("--secondary")
}
