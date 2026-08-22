import { cn } from "@/lib/utils"

const TONOS = [
  "bg-primary text-primary-foreground",
  "bg-sidebar text-sidebar-foreground",
  "bg-success text-success-foreground",
  "bg-warning text-warning-foreground",
  "bg-highlight text-sidebar",
  "bg-primary-hover text-primary-foreground",
] as const

const SUFIJO_EMPRESA = /^(s\.?a\.?|c\.?a\.?|llc|inc|ltd|cia)$/i

function tonoDeSeed(seed: string): (typeof TONOS)[number] {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return TONOS[Math.abs(hash) % TONOS.length]
}

function iniciales(nombre: string, kind: "persona" | "empresa"): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) {
    return "?"
  }
  if (kind === "persona") {
    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase()
    }
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
  }
  const utiles = partes.filter((parte) => !SUFIJO_EMPRESA.test(parte.replaceAll(".", "")))
  const fuente = utiles.length > 0 ? utiles : partes
  if (fuente.length === 1) {
    return fuente[0].slice(0, 2).toUpperCase()
  }
  return `${fuente[0][0]}${fuente[1][0]}`.toUpperCase()
}

const CAJA = {
  sm: "size-7",
  md: "size-8",
  lg: "size-11",
  xl: "size-16",
} as const

const TEXTO = {
  sm: "text-[11px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-base",
} as const

export function EntityAvatar({
  name,
  seed,
  kind = "persona",
  size = "md",
  src,
}: {
  name: string
  seed: string
  kind?: "persona" | "empresa"
  size?: keyof typeof CAJA
  src?: string | null
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn(
          "inline-block shrink-0 bg-muted object-cover",
          kind === "empresa" ? "rounded-md" : "rounded-full",
          CAJA[size],
        )}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium tracking-wide",
        kind === "empresa" ? "rounded-md" : "rounded-full",
        CAJA[size],
        TEXTO[size],
        tonoDeSeed(seed),
      )}
    >
      {iniciales(name, kind)}
    </span>
  )
}
