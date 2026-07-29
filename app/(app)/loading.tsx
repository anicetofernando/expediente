export default function AppLoading() {
  return (
    <div className="min-h-full bg-graphite-50" role="status" aria-label="A carregar página">
      <div className="h-0.5 w-full overflow-hidden bg-navy-100">
        <div className="h-full w-1/3 bg-crimson-600 motion-safe:animate-pulse" />
      </div>
      <div className="border-b border-graphite-200 bg-white px-4 py-3 lg:px-5">
        <div className="h-4 w-44 bg-graphite-150" />
      </div>
      <div className="p-4 lg:p-5">
        <div className="h-10 border border-graphite-200 bg-white" />
        <div className="mt-3 overflow-hidden border border-graphite-200 bg-white">
          <div className="h-8 border-b border-graphite-200 bg-graphite-50" />
          <div className="divide-y divide-graphite-150">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 bg-white" />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">A carregar…</span>
    </div>
  );
}
