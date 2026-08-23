import { OportunidadValor } from "@/components/pipeline/OportunidadValor"
import type { OportunidadKanban } from "@/types/oportunidad"

export function OportunidadDetalle({
  oportunidad,
  etapaNombre,
  servicios,
  causaPrincipal,
  causaSecundaria,
}: {
  oportunidad: OportunidadKanban
  etapaNombre: string
  servicios: { id: string; nombre: string }[]
  causaPrincipal: string | null
  causaSecundaria: string | null
}) {
  const mostrarCausas = oportunidad.etapa === "cierre_perdido"

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Field label="Contacto" value={oportunidad.contacto.nombre_completo} />
      <Field label="Empresa" value={oportunidad.empresa.nombre} />
      <Field label="Ejecutivo" value={oportunidad.ejecutivo.nombre_completo} />
      <Field label="Etapa" value={etapaNombre} />
      <div className="flex flex-col gap-1">
        <dt className="text-micro">Valor</dt>
        <dd className="text-ui">
          <OportunidadValor
            valor_referencial={oportunidad.valor_referencial}
            valor_cotizado={oportunidad.valor_cotizado}
          />
        </dd>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <dt className="text-micro">Servicios</dt>
        <dd className="text-ui">
          {servicios.length > 0
            ? servicios.map((servicio) => servicio.nombre).join(", ")
            : "Sin servicios asociados"}
        </dd>
      </div>
      {mostrarCausas ? (
        <>
          <Field label="Causa de pérdida principal" value={causaPrincipal ?? "Sin registrar"} />
          <Field
            label="Causa de pérdida secundaria"
            value={causaSecundaria ?? "Ninguna"}
          />
        </>
      ) : null}
    </dl>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-micro">{label}</dt>
      <dd className="text-ui">{value}</dd>
    </div>
  )
}
