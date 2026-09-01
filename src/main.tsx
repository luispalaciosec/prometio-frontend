import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { canonicalizarRutaInvitacion } from "./lib/auth-invite"
import App from "./App.tsx"
import "./index.css"

canonicalizarRutaInvitacion()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
