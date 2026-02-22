export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 w-3/4 bg-muted rounded-2xl" />
        <div className="h-5 w-1/3 bg-muted rounded-xl" />
        <div className="aspect-[16/9] bg-muted rounded-3xl" />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="h-4 w-full bg-muted rounded-xl" />
            <div className="h-4 w-5/6 bg-muted rounded-xl" />
            <div className="h-4 w-4/6 bg-muted rounded-xl" />
            <div className="h-4 w-3/4 bg-muted rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-12 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
