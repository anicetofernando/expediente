export function AuthShell({
  children,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="grid min-h-dvh bg-cfm-900 lg:min-h-screen lg:grid-cols-[minmax(320px,38%)_1fr] lg:bg-graphite-50">
      <aside className="relative hidden items-center justify-center overflow-hidden bg-cfm-900 lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cfm-white.webp" alt="CFM" className="h-auto w-48 xl:w-56" />
      </aside>

      <main className="flex min-h-dvh items-center justify-center px-4 py-6 sm:px-5 sm:py-10 lg:min-h-screen">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cfm-white.webp" alt="CFM" className="h-auto w-36" />
          </div>

          <div className="border border-graphite-200 border-t-2 border-t-cfm-600 bg-white p-5 shadow-modal sm:p-7 lg:shadow-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
