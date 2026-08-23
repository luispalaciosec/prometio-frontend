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
