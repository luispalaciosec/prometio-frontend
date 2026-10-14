import * as Sentry from "@sentry/react"

/**
 * Sentry solo arranca si hay DSN (proyecto propio del frontend, distinto del backend).
 * En dev local sin `VITE_SENTRY_DSN` no hace nada.
 */
export function iniciarSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) {
    return
  }
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    tracesSampleRate: 0,
  })
}

/** Asocia los errores al perfil logueado: solo el id, nunca email ni nombre. */
export function sentryUsuario(perfilId: string | null) {
  Sentry.setUser(perfilId ? { id: perfilId } : null)
}
