export default function Loading() {
  return (
    <div className="flex min-h-full flex-1 flex-col gap-4 p-4 sm:p-6" role="status" aria-label="Loading dashboard">
      <div className="h-14 w-full max-w-md animate-pulse rounded-lg bg-surface" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
