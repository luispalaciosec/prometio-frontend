/** ISO → valor de `<input type="datetime-local">` (hora local). */
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) {
    return ""
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Vacío → null. Valor local → ISO. */
export function fromDatetimeLocalValue(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return null
  }
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    throw new Error("fecha inválida")
  }
  return date.toISOString()
}

/** Fecha `YYYY-MM-DD` sin correr el día por zona horaria. */
export function formatDateOnly(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "—"
  }
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) {
    return "—"
  }
  return new Date(year, month - 1, day).toLocaleDateString("es-EC", { dateStyle: "medium" })
}

export function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "—"
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export function formatTimeOnly(iso: string | null): string {
  if (!iso) {
    return "—"
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleTimeString("es-EC", { timeStyle: "short" })
}
