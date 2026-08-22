import { useAuthStore } from "@/store/auth-store"

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

function apiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.replace(/\/$/, "")
  if (fromEnv) {
    return fromEnv
  }
  if (import.meta.env.DEV) {
    return "/api-backend"
  }
  throw new Error("Falta VITE_API_URL.")
}

function leerDetail(body: unknown): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === "string") {
      return detail
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : JSON.stringify(item),
        )
        .join(" ")
    }
  }
  return "No se pudo completar la petición."
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = useAuthStore.getState().session
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`)
  }

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers })
  if (!response.ok) {
    let detail = response.statusText
    try {
      detail = leerDetail(await response.json())
    } catch {
      /* cuerpo no JSON */
    }
    throw new ApiError(response.status, detail)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

function extraerFilename(disposition: string | null): string | null {
  if (!disposition) {
    return null
  }
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1])
    } catch {
      return utf8[1]
    }
  }
  const quoted = disposition.match(/filename="([^"]+)"/i)
  if (quoted?.[1]) {
    return quoted[1]
  }
  const plain = disposition.match(/filename=([^;]+)/i)
  return plain?.[1]?.trim() ?? null
}

export async function apiFetchBlob(
  path: string,
  init: RequestInit = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const session = useAuthStore.getState().session
  const headers = new Headers(init.headers)
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`)
  }
  const response = await fetch(`${apiBase()}${path}`, { ...init, headers })
  if (!response.ok) {
    let detail = response.statusText
    try {
      detail = leerDetail(await response.json())
    } catch {
      /* cuerpo no JSON */
    }
    throw new ApiError(response.status, detail)
  }
  return {
    blob: await response.blob(),
    filename: extraerFilename(response.headers.get("Content-Disposition")),
  }
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export function extraerUuid(texto: string): string | null {
  return texto.match(UUID_RE)?.[0] ?? null
}
