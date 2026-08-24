import { HomePlaceholderPage } from "@/pages/HomePlaceholderPage"
import { BienvenidaPage } from "@/pages/BienvenidaPage"
import { puedeVerModuloVentas } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"

export function HomePage() {
  const perfil = useAuthStore((state) => state.perfil)
  if (perfil && puedeVerModuloVentas(perfil)) {
    return <BienvenidaPage />
  }
  return <HomePlaceholderPage />
}
