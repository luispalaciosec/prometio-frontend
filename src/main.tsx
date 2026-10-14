import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ErrorBoundary } from "@sentry/react"

import { ErrorFallback } from "./components/error-fallback"
import { canonicalizarRutaInvitacion } from "./lib/auth-invite"
import { iniciarSentry } from "./lib/sentry"
import App from "./App.tsx"
import "./index.css"

iniciarSentry()
canonicalizarRutaInvitacion()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
