const SkeletonCard = () => (
  <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-4 w-16 bg-muted rounded" />
    </div>
    <div className="flex gap-4">
      <div className="h-3 w-20 bg-muted rounded" />
      <div className="h-3 w-20 bg-muted rounded" />
      <div className="h-3 w-16 bg-muted rounded" />
    </div>
    <div className="h-3 w-48 bg-muted rounded" />
  </div>
);

export default SkeletonCard;
