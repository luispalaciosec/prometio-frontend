/**
 * Logo de la organización. Si no hay logo_url, usa el mark fijo de prometIO.
 */
import { useOrgStore } from "@/store/org-store"

export function PrometioLogo({
  onDark = false,
  className,
}: {
  onDark?: boolean
  className?: string
}) {
  const org = useOrgStore((state) => state.organizacion)
  const wordmark = org?.nombre || "prometIO"

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {org?.logo_url ? (
        <img
          src={org.logo_url}
          alt=""
          className="h-7 w-auto max-w-28 shrink-0 object-contain"
        />
      ) : (
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-7 shrink-0"
          aria-hidden
        >
          <rect width="28" height="28" rx="7" fill="#05729f" />
          <path
            d="M8 18.5c3.2-6 8.8-6 12 0"
            stroke="#05c7e8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="14" cy="11" r="2.2" fill="#ffffff" />
        </svg>
      )}
      <span
        className={
          onDark
            ? "font-heading text-base font-semibold tracking-tight text-sidebar-foreground"
            : "font-heading text-base font-semibold tracking-tight text-foreground"
        }
      >
        {wordmark === "prometIO" ? (
          <>
            promet<span className="text-highlight">IO</span>
          </>
        ) : (
          wordmark
        )}
      </span>
    </span>
  )
}
