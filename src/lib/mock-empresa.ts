/**
 * Mock de empresa. Intercambiable vía src/lib/api/empresa.ts.
 */
import { MOCK_ORGANIZACION_ID } from "@/lib/mock-config"
import type { Empresa, EmpresaCreate, EmpresaUpdate } from "@/types/empresa"

const STORAGE_KEY = "prometio-mock-empresa-v1"

function vacio(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ""
  return trimmed === "" ? null : trimmed
}

function seed(): Empresa[] {
  const org = MOCK_ORGANIZACION_ID
  const created_at = "2026-03-01T15:00:00.000Z"
  return [
    {
      id: "em-1",
      organizacion_id: org,
      nombre: "Café de Altura",
      web: "https://cafedealtura.ec",
      direccion: "Av. Amazonas 123, Quito",
      ruc: "1790012345001",
      sector: null,
      tamano_estimado: null,
      linkedin_url: null,
      datos_enriquecidos: {},
      propiedades_custom: {},
      created_at,
    },
    {
      id: "em-2",
      organizacion_id: org,
      nombre: "Banco Andino",
      web: "https://bancoandino.ec",
      direccion: null,
      ruc: "1790098765001",
      sector: "Servicios financieros",
      tamano_estimado: "1001-5000",
      linkedin_url: "https://www.linkedin.com/company/banco-andino",
      datos_enriquecidos: {
        google_resultados: [
          {
            title: "Banco Andino — inicio",
            url: "https://bancoandino.ec",
            description: "Banca personal y empresarial en Ecuador.",
          },
        ],
        linkedin: { employeeCount: 1200 },
      },
      propiedades_custom: {},
      created_at,
    },
    {
      id: "em-3",
      organizacion_id: org,
      nombre: "Clínica del Valle",
      web: null,
      direccion: "Cumbayá",
      ruc: null,
      sector: null,
      tamano_estimado: null,
      linkedin_url: null,
      datos_enriquecidos: { enriquecimiento_error: "Timeout de Apify (simulado)." },
      propiedades_custom: {},
      created_at,
    },
  ]
}

function load(): Empresa[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as Empresa[]
    }
  } catch {
    /* seed */
  }
  const rows = seed()
  save(rows)
  return rows
}

function save(rows: Empresa[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export async function listEmpresas(): Promise<Empresa[]> {
  return [...load()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}

export async function getEmpresa(id: string): Promise<Empresa> {
  const row = load().find((item) => item.id === id)
  if (!row) {
    throw new Error("Empresa no encontrada.")
  }
  return row
}

export async function createEmpresa(input: EmpresaCreate): Promise<Empresa> {
  const nombre = input.nombre.trim()
  if (!nombre) {
    throw new Error("nombre es obligatorio.")
  }
  const row: Empresa = {
    id: crypto.randomUUID(),
    organizacion_id: MOCK_ORGANIZACION_ID,
    nombre,
    web: vacio(input.web),
    direccion: vacio(input.direccion),
    ruc: vacio(input.ruc),
    sector: null,
    tamano_estimado: null,
    linkedin_url: null,
    datos_enriquecidos: {},
    propiedades_custom: {},
    created_at: new Date().toISOString(),
  }
  const rows = load()
  rows.push(row)
  save(rows)
  return row
}

export async function updateEmpresa(id: string, input: EmpresaUpdate): Promise<Empresa> {
  const rows = load()
  const index = rows.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new Error("Empresa no encontrada.")
  }
  const current = rows[index]
  const nombre = input.nombre !== undefined ? vacio(input.nombre) : current.nombre
  if (!nombre) {
    throw new Error("nombre es obligatorio.")
  }
  const next: Empresa = {
    ...current,
    nombre,
    web: input.web !== undefined ? vacio(input.web) : current.web,
    direccion: input.direccion !== undefined ? vacio(input.direccion) : current.direccion,
    ruc: input.ruc !== undefined ? vacio(input.ruc) : current.ruc,
  }
  rows[index] = next
  save(rows)
  return next
}

export async function enriquecerEmpresa(id: string): Promise<Empresa> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const rows = load()
  const index = rows.findIndex((item) => item.id === id)
  if (index < 0) {
    throw new Error("Empresa no encontrada.")
  }
  const current = rows[index]
  const next: Empresa = {
    ...current,
    sector: current.sector ?? "Servicios profesionales",
    tamano_estimado: current.tamano_estimado ?? "11-50",
    linkedin_url:
      current.linkedin_url ?? `https://www.linkedin.com/company/${current.nombre.toLowerCase().replace(/\s+/g, "-")}`,
    datos_enriquecidos: {
      google_resultados: [
        {
          title: current.nombre,
          url: current.web ?? "https://www.google.com/search?q=" + encodeURIComponent(current.nombre),
          description: `Resultados simulados de Google para ${current.nombre}.`,
        },
      ],
      linkedin: { mock: true },
    },
  }
  rows[index] = next
  save(rows)
  return next
}
