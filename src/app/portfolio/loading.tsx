import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PortfolioLoading() {
  return (
    <div className="container-wide pb-24 pt-36 lg:pt-44">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-6 h-14 w-2/3" />
      <Skeleton className="mt-4 h-5 w-1/2" />
      <div className="mt-10 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
