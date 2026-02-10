import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-navy/10 mb-4 tracking-tight">404</div>
        <h1 className="text-2xl font-bold text-navy mb-2 tracking-tight">Sidan hittades inte</h1>
        <p className="text-gray-500 mb-8 text-[15px] leading-relaxed">
          Den sida du söker finns inte eller har flyttats.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="btn-glow px-6 py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
          >
            Till startsidan
          </Link>
          <Link
            href="/annonser"
            className="px-6 py-3 border border-navy/20 text-navy rounded-xl text-sm font-medium hover:bg-navy/[0.03] transition-colors"
          >
            Alla annonser
          </Link>
        </div>
      </div>
    </div>
  );
}
