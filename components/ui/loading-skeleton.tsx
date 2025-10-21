import { Skeleton } from "@/components/ui/skeleton"

export function AssessmentCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  )
}

export function TaskSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <Skeleton className="h-5 w-5 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}