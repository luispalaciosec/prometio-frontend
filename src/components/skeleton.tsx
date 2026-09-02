import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-skeleton rounded-lg bg-muted", className)} />
}

export function PipelineSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" aria-hidden>
      {Array.from({ length: 4 }, (_, column) => (
        <div key={column} className="flex w-64 shrink-0 flex-col">
          <div className="mb-2 flex items-center justify-between px-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-4" />
          </div>
          <div className="flex min-h-40 flex-col gap-2 rounded-xl p-2 ring-1 ring-border">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-[72px] rounded-xl" />
        <Skeleton className="h-[72px] rounded-xl" />
        <Skeleton className="h-[72px] rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, row) => (
          <Skeleton key={row} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}

export function OportunidadSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }, (_, row) => (
        <Skeleton key={row} className="h-8 w-full" />
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function TilesSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)} aria-hidden>
      {Array.from({ length: count }, (_, tile) => (
        <Skeleton key={tile} className="h-[88px] rounded-xl" />
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col px-3" aria-hidden>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="space-y-2 border-b border-border py-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {Array.from({ length: 2 }, (_, day) => (
        <div key={day} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="flex items-start gap-2 rounded-xl p-3 ring-1 ring-border">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function DocumentoAlcanceSectionSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-52 rounded-md" />
      </div>
      <div className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-border">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-full max-w-sm" />
        </div>
      </div>
      <div className="space-y-3 rounded-xl p-4 ring-1 ring-border">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}
