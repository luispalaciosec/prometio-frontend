import { ConectorCard, type ConectorEstado } from "@/components/conectores/ConectorCard"
import { PageHeader } from "@/components/page-header"

const CONECTORES: { nombre: string; inicial: string; estado: ConectorEstado }[] = [
  { nombre: "Claude", inicial: "C", estado: "en_desarrollo" },
  { nombre: "OpenAI", inicial: "O", estado: "proximamente" },
  { nombre: "Gemini", inicial: "G", estado: "proximamente" },
]

export function ConectoresPage() {
  return (
    <>
      <PageHeader
        title="Conectores"
        description="Vínculo con asistentes de IA. Todavía no hay conexión activa."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {CONECTORES.map((conector) => (
          <ConectorCard key={conector.nombre} {...conector} />
        ))}
      </div>
    </>
  )
}
