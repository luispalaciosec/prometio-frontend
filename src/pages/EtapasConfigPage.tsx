import { useEffect, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getConfiguracionGeneral,
  listEtapasPipeline,
  updateConfiguracionGeneral,
  updateEtapaPipeline,
} from "@/lib/config-api"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { EtapaPipeline } from "@/types/etapa-pipeline"

export function EtapasConfigPage() {
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([])
  const [general, setGeneral] = useState<ConfiguracionGeneral | null>(null)
  const [multiplicador, setMultiplicador] = useState("2")

  useEffect(() => {
    void Promise.all([listEtapasPipeline(), getConfiguracionGeneral()]).then(
      ([pipeline, config]) => {
        setEtapas(pipeline)
        setGeneral(config)
        if (config) {
          setMultiplicador(String(config.multiplicador_escalamiento_supervisor))
        }
      },
    )
  }, [])

  function patchEtapa(
    id: string,
    field: "probabilidad_cierre_default_pct" | "umbral_alerta_horas",
    value: string,
  ) {
    setEtapas((prev) =>
      prev.map((row) => {
        if (row.id !== id) {
          return row
        }
        if (field === "umbral_alerta_horas") {
          return {
            ...row,
            umbral_alerta_horas: value === "" ? null : Number(value),
          }
        }
        return { ...row, probabilidad_cierre_default_pct: Number(value) }
      }),
    )
  }

  async function save() {
    await Promise.all(
      etapas.map((row) =>
        updateEtapaPipeline(row.id, {
          probabilidad_cierre_default_pct: row.probabilidad_cierre_default_pct,
          umbral_alerta_horas: row.umbral_alerta_horas,
        }),
      ),
    )
    if (general) {
      const multiplicador_escalamiento_supervisor = Number(multiplicador)
      if (Number.isNaN(multiplicador_escalamiento_supervisor)) {
        toast.error("El multiplicador de escalamiento no es un número válido.")
        return
      }
      await updateConfiguracionGeneral({
        margen_agencia_default_pct: general.margen_agencia_default_pct,
        comision_agencia_default_min_pct: general.comision_agencia_default_min_pct,
        comision_agencia_default_max_pct: general.comision_agencia_default_max_pct,
        umbral_descuento_aprobacion_pct: general.umbral_descuento_aprobacion_pct,
        tasa_impuesto_pct: general.tasa_impuesto_pct,
        multiplicador_escalamiento_supervisor,
      })
    }
    toast.success("Etapas guardadas.")
  }

  return (
    <>
      <PageHeader
        title="Etapas y alertas"
        description="Las 9 etapas son fijas: código, nombre y orden no se editan. Si el umbral de alerta queda vacío, esa etapa no genera alerta (cierres)."
        action={<Button onClick={() => void save()}>Guardar</Button>}
      />
      <div className="mb-6 max-w-lg space-y-2">
        <Label htmlFor="multiplicador_escalamiento_supervisor">
          Multiplicador de escalamiento al supervisor
        </Label>
        <Input
          id="multiplicador_escalamiento_supervisor"
          type="number"
          min="1"
          step="0.1"
          value={multiplicador}
          disabled={!general}
          onChange={(event) => setMultiplicador(event.target.value)}
        />
        <p className="text-kicker">
          Es global, no cambia por etapa. Si una oportunidad se queda sin actividad más allá del
          umbral de la etapa, entra en alerta. Si además supera umbral × este número (2 = el doble
          de horas), escala al supervisor.{" "}
          {general
            ? null
            : "Creá la fila en Márgenes e impuestos para poder editarlo."}
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Orden</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Probabilidad de cierre (%)</TableHead>
            <TableHead>Umbral de alerta (horas)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {etapas.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.orden}</TableCell>
              <TableCell className="font-mono text-xs">{row.codigo}</TableCell>
              <TableCell>{row.nombre}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="h-8 w-24"
                  value={row.probabilidad_cierre_default_pct}
                  onChange={(event) =>
                    patchEtapa(
                      row.id,
                      "probabilidad_cierre_default_pct",
                      event.target.value,
                    )
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  className="h-8 w-24"
                  value={row.umbral_alerta_horas ?? ""}
                  placeholder="—"
                  onChange={(event) =>
                    patchEtapa(row.id, "umbral_alerta_horas", event.target.value)
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
