import type { SeoCoreWebVitals, SeoEstrategia, SeoFuente } from "@/types/seo"

export type CwvUmbral = "bueno" | "mejorar" | "pobre" | "na"

export type CwvPorEstrategia = Record<SeoEstrategia, SeoCoreWebVitals | null>

export type CwvPorFuente = Record<SeoFuente, CwvPorEstrategia>

const VACIO_ESTRATEGIA: CwvPorEstrategia = { mobile: null, desktop: null }

export function agruparCwvPorFuente(rows: SeoCoreWebVitals[]): CwvPorFuente {
  const agrupado: CwvPorFuente = {
    campo: { ...VACIO_ESTRATEGIA },
    laboratorio: { ...VACIO_ESTRATEGIA },
  }
  for (const row of rows) {
    if (!agrupado[row.fuente][row.estrategia]) {
      agrupado[row.fuente][row.estrategia] = row
    }
  }
  return agrupado
}

export function fuenteTieneDatos(slot: CwvPorEstrategia): boolean {
  return slot.mobile != null || slot.desktop != null
}

export function umbralLcp(ms: number | null): CwvUmbral {
  if (ms == null) return "na"
  if (ms <= 2500) return "bueno"
  if (ms <= 4000) return "mejorar"
  return "pobre"
}

export function umbralInp(ms: number | null): CwvUmbral {
  if (ms == null) return "na"
  if (ms <= 200) return "bueno"
  if (ms <= 500) return "mejorar"
  return "pobre"
}

export function umbralCls(cls: number | null): CwvUmbral {
  if (cls == null) return "na"
  if (cls <= 0.1) return "bueno"
  if (cls <= 0.25) return "mejorar"
  return "pobre"
}

export function formatoMsComoSegundos(ms: number | null): string {
  if (ms == null) return "—"
  return `${(ms / 1000).toFixed(1)} s`
}

export function formatoMs(ms: number | null): string {
  if (ms == null) return "—"
  return `${Math.round(ms)} ms`
}

export function formatoCls(cls: number | null): string {
  if (cls == null) return "—"
  return cls.toFixed(3)
}

export const CWV_UMBRAL_CLASE: Record<CwvUmbral, string> = {
  bueno: "text-success",
  mejorar: "text-warning",
  pobre: "text-destructive",
  na: "text-muted-foreground",
}
