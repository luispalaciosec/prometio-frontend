export const BASECAMP_CALLBACK_PATH = "/auth/basecamp/callback"

const STATE_KEY = "prometio-basecamp-oauth-state"

export function redirectUriBasecamp(): string {
  return `${window.location.origin}${BASECAMP_CALLBACK_PATH}`
}

export function iniciarConexionBasecamp(): void {
  const clientId = import.meta.env.VITE_BASECAMP_CLIENT_ID
  if (!clientId) {
    throw new Error("Falta VITE_BASECAMP_CLIENT_ID en el entorno.")
  }
  const state = crypto.randomUUID()
  sessionStorage.setItem(STATE_KEY, state)
  const url = new URL("https://launchpad.37signals.com/authorization/new")
  url.searchParams.set("type", "web_server")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUriBasecamp())
  url.searchParams.set("state", state)
  window.location.assign(url.toString())
}

export function validarStateBasecamp(state: string | null): boolean {
  const esperado = sessionStorage.getItem(STATE_KEY)
  return Boolean(state && esperado && state === esperado)
}

export function limpiarStateBasecamp(): void {
  sessionStorage.removeItem(STATE_KEY)
}
