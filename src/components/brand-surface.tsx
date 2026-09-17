import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Superficie que usa tokens --brand-* (cotizaciones, previews cliente, widget embebido).
 * La app CRM usa --primary / sidebar por defecto (Stripe app shell).
 */
export function BrandSurface({
  className,
  children,
  style,
}: {
  className?: string
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div className={cn("brand-surface", className)} style={style}>
      {children}
    </div>
  )
}
