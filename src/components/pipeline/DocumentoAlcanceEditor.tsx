import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocumentoAlcanceRichText } from "@/components/pipeline/DocumentoAlcanceRichText"
import type { DocumentoAlcance, EntregableDocumento, SeccionAlcanceFuncional } from "@/types/documento-alcance"

export type DocumentoAlcanceDraft = {
  objetivo: string | null
  alcance_funcional: SeccionAlcanceFuncional[]
  alcance_tecnico_incluido: string | null
  alcance_tecnico_no_incluido: string | null
  metodologia: string | null
  tiempos: string | null
  modelo_inversion: string | null
  supuestos: string | null
  entregables: EntregableDocumento[]
  condiciones_pago_texto: string | null
  exclusiones_texto: string | null
  consideraciones_texto: string | null
  por_que_geeks_texto: string | null
}

export function draftDesdeDocumento(doc: DocumentoAlcance): DocumentoAlcanceDraft {
  return {
    objetivo: doc.objetivo,
    alcance_funcional: doc.alcance_funcional ?? [],
    alcance_tecnico_incluido: doc.alcance_tecnico_incluido,
    alcance_tecnico_no_incluido: doc.alcance_tecnico_no_incluido,
    metodologia: doc.metodologia,
    tiempos: doc.tiempos,
    modelo_inversion: doc.modelo_inversion,
    supuestos: doc.supuestos,
    entregables: doc.entregables ?? [],
    condiciones_pago_texto: doc.condiciones_pago_texto,
    exclusiones_texto: doc.exclusiones_texto,
    consideraciones_texto: doc.consideraciones_texto,
    por_que_geeks_texto: doc.por_que_geeks_texto,
  }
}

export function DocumentoAlcanceEditor({
  draft,
  disabled,
  defaultsCapa2,
  onChange,
}: {
  draft: DocumentoAlcanceDraft
  disabled: boolean
  defaultsCapa2: {
    exclusiones: string | null
    consideraciones: string | null
    porQueGeeks: string | null
  }
  onChange: (next: DocumentoAlcanceDraft) => void
}) {
  function setCampo<K extends keyof DocumentoAlcanceDraft>(campo: K, valor: DocumentoAlcanceDraft[K]) {
    onChange({ ...draft, [campo]: valor })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-ui-medium">Contenido</p>
        <CampoRich
          label="Objetivo"
          value={draft.objetivo}
          disabled={disabled}
          onChange={(objetivo) => setCampo("objetivo", objetivo)}
        />
        <AlcanceFuncionalEditor
          value={draft.alcance_funcional}
          disabled={disabled}
          onChange={(alcance_funcional) => setCampo("alcance_funcional", alcance_funcional)}
        />
        <CampoRich
          label="Alcance técnico incluido"
          value={draft.alcance_tecnico_incluido}
          disabled={disabled}
          onChange={(alcance_tecnico_incluido) =>
            setCampo("alcance_tecnico_incluido", alcance_tecnico_incluido)
          }
        />
        <CampoRich
          label="Alcance técnico no incluido"
          value={draft.alcance_tecnico_no_incluido}
          disabled={disabled}
          onChange={(alcance_tecnico_no_incluido) =>
            setCampo("alcance_tecnico_no_incluido", alcance_tecnico_no_incluido)
          }
        />
        <CampoRich
          label="Metodología"
          value={draft.metodologia}
          disabled={disabled}
          onChange={(metodologia) => setCampo("metodologia", metodologia)}
        />
        <CampoRich
          label="Tiempos"
          value={draft.tiempos}
          disabled={disabled}
          onChange={(tiempos) => setCampo("tiempos", tiempos)}
        />
        <CampoRich
          label="Modelo de inversión"
          value={draft.modelo_inversion}
          disabled={disabled}
          onChange={(modelo_inversion) => setCampo("modelo_inversion", modelo_inversion)}
        />
        <CampoRich
          label="Supuestos"
          value={draft.supuestos}
          disabled={disabled}
          onChange={(supuestos) => setCampo("supuestos", supuestos)}
        />
        <EntregablesEditor
          value={draft.entregables}
          disabled={disabled}
          onChange={(entregables) => setCampo("entregables", entregables)}
        />
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-ui-medium">Textos fijos de la agencia</p>
          <p className="mt-1 text-kicker">
            Vacío = en el PDF se usa el default. Si escribís, este documento lo pisa.
          </p>
        </div>
        <CampoRich
          label="Condiciones de pago"
          value={draft.condiciones_pago_texto}
          disabled={disabled}
          onChange={(condiciones_pago_texto) => setCampo("condiciones_pago_texto", condiciones_pago_texto)}
        />
        <CampoRich
          label="Exclusiones"
          value={draft.exclusiones_texto}
          disabled={disabled}
          placeholder={placeholderDefault(defaultsCapa2.exclusiones)}
          onChange={(exclusiones_texto) => setCampo("exclusiones_texto", exclusiones_texto)}
        />
        <CampoRich
          label="Consideraciones"
          value={draft.consideraciones_texto}
          disabled={disabled}
          placeholder={placeholderDefault(defaultsCapa2.consideraciones)}
          onChange={(consideraciones_texto) => setCampo("consideraciones_texto", consideraciones_texto)}
        />
        <CampoRich
          label="Por qué Geeks"
          value={draft.por_que_geeks_texto}
          disabled={disabled}
          placeholder={placeholderDefault(defaultsCapa2.porQueGeeks)}
          onChange={(por_que_geeks_texto) => setCampo("por_que_geeks_texto", por_que_geeks_texto)}
        />
      </div>
    </div>
  )
}

function placeholderDefault(valor: string | null): string | undefined {
  if (!valor?.trim()) {
    return "Sin default de agencia todavía. El PDF sale vacío en esta sección si no escribís nada."
  }
  return `Default de agencia (se usa si dejás este campo vacío):\n${valor}`
}

function CampoRich({
  label,
  value,
  disabled,
  placeholder,
  onChange,
}: {
  label: string
  value: string | null
  disabled: boolean
  placeholder?: string
  onChange: (next: string | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <DocumentoAlcanceRichText
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  )
}

function AlcanceFuncionalEditor({
  value,
  disabled,
  onChange,
}: {
  value: SeccionAlcanceFuncional[]
  disabled: boolean
  onChange: (next: SeccionAlcanceFuncional[]) => void
}) {
  function setSeccion(index: number, next: SeccionAlcanceFuncional) {
    onChange(value.map((row, i) => (i === index ? next : row)))
  }

  return (
    <div className="space-y-2">
      <Label>Alcance funcional</Label>
      {value.length === 0 ? <p className="text-kicker">Sin secciones todavía.</p> : null}
      <ul className="space-y-2">
        {value.map((row, index) => (
          <li key={index} className="space-y-2 rounded-xl p-3 ring-1 ring-border">
            <div className="flex items-start gap-2">
              <Input
                value={row.seccion}
                disabled={disabled}
                placeholder="Sección"
                onChange={(event) => setSeccion(index, { ...row, seccion: event.target.value })}
              />
              {disabled ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  Quitar
                </Button>
              )}
            </div>
            <ul className="space-y-1.5">
              {row.entregables.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-2">
                  <Input
                    value={item}
                    disabled={disabled}
                    placeholder="Entregable"
                    onChange={(event) => {
                      const entregables = row.entregables.map((actual, i) =>
                        i === itemIndex ? event.target.value : actual,
                      )
                      setSeccion(index, { ...row, entregables })
                    }}
                  />
                  {disabled ? null : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        setSeccion(index, {
                          ...row,
                          entregables: row.entregables.filter((_, i) => i !== itemIndex),
                        })
                      }
                    >
                      Quitar
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {disabled ? null : (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setSeccion(index, { ...row, entregables: [...row.entregables, ""] })}
              >
                Agregar entregable
              </Button>
            )}
          </li>
        ))}
      </ul>
      {disabled ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { seccion: "", entregables: [""] }])}
        >
          Agregar sección
        </Button>
      )}
    </div>
  )
}

function EntregablesEditor({
  value,
  disabled,
  onChange,
}: {
  value: EntregableDocumento[]
  disabled: boolean
  onChange: (next: EntregableDocumento[]) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Entregables</Label>
      {value.length === 0 ? <p className="text-kicker">Sin entregables todavía.</p> : null}
      <ul className="space-y-2">
        {value.map((row, index) => (
          <li key={index} className="space-y-2 rounded-xl p-3 ring-1 ring-border">
            <div className="flex items-start gap-2">
              <Input
                value={row.nombre}
                disabled={disabled}
                placeholder="Nombre"
                onChange={(event) =>
                  onChange(value.map((item, i) => (i === index ? { ...item, nombre: event.target.value } : item)))
                }
              />
              {disabled ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  Quitar
                </Button>
              )}
            </div>
            <Input
              value={row.descripcion}
              disabled={disabled}
              placeholder="Descripción"
              onChange={(event) =>
                onChange(
                  value.map((item, i) => (i === index ? { ...item, descripcion: event.target.value } : item)),
                )
              }
            />
          </li>
        ))}
      </ul>
      {disabled ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { nombre: "", descripcion: "" }])}
        >
          Agregar entregable
        </Button>
      )}
    </div>
  )
}
