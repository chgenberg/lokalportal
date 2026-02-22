export default function MaklareLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-card p-6 space-y-3">
            <div className="h-4 w-20 bg-muted rounded-xl" />
            <div className="h-8 w-16 bg-muted rounded-xl" />
          </div>
        ))}
      </div>
      <div className="dashboard-card p-6 space-y-4">
        <div className="h-6 w-40 bg-muted rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
