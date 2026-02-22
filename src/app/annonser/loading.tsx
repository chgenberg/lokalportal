export default function AnnonserLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="h-10 w-64 bg-muted rounded-2xl mb-6" />
        <div className="h-12 w-full max-w-xl bg-muted rounded-full mb-6" />
      </div>
      <div className="max-w-7xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-2xl h-72" />
        ))}
      </div>
    </div>
  );
}
