/** Site key pública — misma constante que `public/widget/prometio-form.js`. */
export const HCAPTCHA_SITE_KEY = "0f7cabfa-c2ba-414e-ade0-2b2472222c96"

export const FORMULARIO_UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fclid",
  "gclid",
] as const

function apiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "")
  if (fromEnv) {
    return fromEnv
  }
  if (import.meta.env.DEV) {
    return "/api-backend"
  }
  throw new Error("Falta VITE_API_URL.")
}

export function formularioPostUrl(): string {
  return `${apiBase()}/formulario`
}

export function formularioMarcaUrl(): string {
  return `${apiBase()}/formulario/marca`
}

export function formularioCamposPublicUrl(): string {
  return `${apiBase()}/formulario/campos`
}

export function widgetScriptUrl(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin}/widget/prometio-form.js`
}

export function formularioDemoUrl(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin}/formulario-demo`
}

export function buildSnippet(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `<script src="${widgetScriptUrl(origin)}"></script>
<prometio-formulario api="${formularioPostUrl()}"></prometio-formulario>`
}

export function dominioDe(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
