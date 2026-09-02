import { Navigate } from "react-router-dom"
import { HomePlaceholderPage } from "@/pages/HomePlaceholderPage"
import { BienvenidaPage } from "@/pages/BienvenidaPage"
import { puedeVerModuloVentas } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"

export function HomePage() {
  const perfil = useAuthStore((state) => state.perfil)
  if (perfil?.equipo === "proveedores") {
    return <Navigate to="/proveedores" replace />
  }
  if (perfil && puedeVerModuloVentas(perfil)) {
    return <BienvenidaPage />
  }
  return <HomePlaceholderPage />
}
