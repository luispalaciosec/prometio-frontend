import { cn } from "@/lib/utils"

function hrefSeguro(value: string): string {
  const trimmed = value.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 1 1 8.3 6.5a1.78 1.78 0 0 1-1.8 1.75ZM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19a.66.66 0 0 0 0 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  )
}

export function LinkedInLink({
  href,
  compact = false,
  className,
}: {
  href: string | null | undefined
  compact?: boolean
  className?: string
}) {
  if (!href?.trim()) {
    return null
  }
  const url = hrefSeguro(href)

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title="Abrir LinkedIn"
      aria-label="Abrir LinkedIn"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5",
        compact
          ? "rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary"
          : "rounded-md px-2 py-1 text-sm font-medium text-primary ring-1 ring-border hover:bg-muted",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <LinkedInIcon className="size-3.5" />
      {compact ? null : "LinkedIn"}
    </a>
  )
}
