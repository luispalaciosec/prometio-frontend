import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Target } from "lucide-react"

export function MetaComercialPage() {
  return (
    <>
      <PageHeader
        title="Meta comercial"
        description="Meta de ventas total y por vendedor. El contrato con el backend todavía no está cerrado."
      />
      <EmptyState
        icon={Target}
        title="Próximamente"
        body="Cuando el backend cierre el contrato, acá se carga la meta del equipo y la individual por vendedor."
      />
    </>
  )
}
