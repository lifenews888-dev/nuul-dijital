import { CardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="container-wide pb-24 pt-36 lg:pt-44">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-6 h-14 w-1/2" />
      <Skeleton className="mt-4 h-5 w-2/3" />
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
