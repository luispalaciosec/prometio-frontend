import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ContratoLineasEditor } from "@/components/contratos/ContratoLineasEditor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchCombobox } from "@/components/ui/search-combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createContrato } from "@/lib/api/contrato-recurrente"
import { listContactos } from "@/lib/api/contacto"
import { listEmpresas } from "@/lib/api/empresa"
import { listOportunidadesLookup } from "@/lib/api/oportunidad"
import {
  lineaBorradorVacia,
  validarLineasBorrador,
  type ContratoLineaBorrador,
} from "@/lib/contrato-lineas-borrador"
import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { Contacto } from "@/types/contacto"
import type { ContratoRecurrenteDetalle } from "@/types/contrato-recurrente"
import type { Empresa } from "@/types/empresa"
import type { Oportunidad } from "@/types/oportunidad"
import type { Servicio } from "@/types/servicio"

const NUEVA_OPORTUNIDAD = "__nueva__"

export function ContratoNuevoDialog({
  open,
  servicios,
  categorias,
  onCreated,
  onCancel,
}: {
  open: boolean
  servicios: Servicio[]
  categorias: CategoriaServicio[]
  onCreated: (contrato: ContratoRecurrenteDetalle) => void
  onCancel: () => void
}) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [empresaId, setEmpresaId] = useState("")
  const [contactoId, setContactoId] = useState("")
  const [oportunidadId, setOportunidadId] = useState(NUEVA_OPORTUNIDAD)
  const [nombre, setNombre] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [notas, setNotas] = useState("")
  const [lineas, setLineas] = useState<ContratoLineaBorrador[]>(() => [lineaBorradorVacia()])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    void Promise.all([listEmpresas(), listOportunidadesLookup()])
      .then(([empresasRows, oportunidadesRows]) => {
        if (!cancelled) {
          setEmpresas(empresasRows)
          setOportunidades(oportunidadesRows)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar las empresas.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    setContactoId("")
    setOportunidadId(NUEVA_OPORTUNIDAD)
    if (!empresaId) {
      setContactos([])
      return
    }
    let cancelled = false
    void listContactos({ empresa_id: empresaId })
      .then((rows) => {
        if (!cancelled) {
          setContactos(rows)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar los contactos.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [empresaId])

  const oportunidadesEmpresa = oportunidades.filter((row) => row.empresa_id === empresaId)

  function reset() {
    setEmpresaId("")
    setContactoId("")
    setOportunidadId(NUEVA_OPORTUNIDAD)
    setNombre("")
    setFechaInicio("")
    setFechaFin("")
    setNotas("")
    setLineas([lineaBorradorVacia()])
  }

  function cerrar() {
    reset()
    onCancel()
  }

  async function guardar() {
    if (!empresaId || !contactoId) {
      toast.error("Elegí la empresa y el contacto.")
      return
    }
    if (!nombre.trim()) {
      toast.error("Poné un nombre al contrato.")
      return
    }
    if (!fechaInicio || !fechaFin) {
      toast.error("Elegí fecha de inicio y de fin.")
      return
    }
    if (fechaFin < fechaInicio) {
      toast.error("La fecha de fin no puede ser anterior a la de inicio.")
      return
    }
    const validadas = validarLineasBorrador(lineas)
    if ("error" in validadas) {
      toast.error(validadas.error)
      return
    }
    setEnviando(true)
    try {
      const contrato = await createContrato({
        empresa_id: empresaId,
        contacto_id: contactoId,
        oportunidad_id: oportunidadId === NUEVA_OPORTUNIDAD ? null : oportunidadId,
        nombre,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        notas,
        lineas: validadas.lineas,
      })
      reset()
      onCreated(contrato)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el contrato.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          cerrar()
        }
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void guardar()
          }}
        >
          <DialogHeader>
            <DialogTitle>Nuevo contrato de fee recurrente</DialogTitle>
            <DialogDescription>
              Cada mes de vigencia genera una cotización en «Por facturar» con estas líneas. Montos
              sin IVA.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <SearchCombobox
                id="contrato-empresa"
                label="Empresa"
                placeholder="Buscar empresa"
                value={empresaId}
                onChange={setEmpresaId}
                options={empresas.map((row) => ({ value: row.id, label: row.nombre }))}
                disabled={enviando}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contrato-contacto">Contacto</Label>
              <Select
                value={contactoId || undefined}
                onValueChange={setContactoId}
                disabled={enviando || !empresaId}
              >
                <SelectTrigger id="contrato-contacto">
                  <SelectValue
                    placeholder={
                      !empresaId
                        ? "Primero elegí la empresa"
                        : contactos.length === 0
                          ? "La empresa no tiene contactos"
                          : "Elegí un contacto"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {contactos.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contrato-oportunidad">Oportunidad</Label>
              <Select
                value={oportunidadId}
                onValueChange={setOportunidadId}
                disabled={enviando || !empresaId}
              >
                <SelectTrigger id="contrato-oportunidad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NUEVA_OPORTUNIDAD}>Crear una oportunidad ganada</SelectItem>
                  {oportunidadesEmpresa.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.nombre ?? "Oportunidad sin nombre"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="contrato-nombre">Nombre del contrato</Label>
              <Input
                id="contrato-nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Fee de marketing digital 2027"
                disabled={enviando}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contrato-inicio">Inicio</Label>
              <Input
                id="contrato-inicio"
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                disabled={enviando}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contrato-fin">Fin</Label>
              <Input
                id="contrato-fin"
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                onChange={(event) => setFechaFin(event.target.value)}
                disabled={enviando}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="contrato-notas">Notas (opcional)</Label>
              <Textarea
                id="contrato-notas"
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                rows={2}
                disabled={enviando}
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-ui-medium">Líneas</p>
            <ContratoLineasEditor
              lineas={lineas}
              onChange={setLineas}
              servicios={servicios}
              categorias={categorias}
              disabled={enviando}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              Crear contrato
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
