export function AuthShell({
  children,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="grid min-h-screen bg-graphite-50 lg:grid-cols-[minmax(320px,38%)_1fr]">
      <aside className="relative hidden items-center justify-center overflow-hidden bg-cfm-900 lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cfm-white.webp" alt="CFM" className="h-auto w-48 xl:w-56" />
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-5 flex justify-center lg:hidden">
            <div className="flex items-center justify-center bg-cfm-900 px-5 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cfm-white.webp" alt="CFM" className="h-auto w-28" />
            </div>
          </div>

          <div className="border border-graphite-200 border-t-2 border-t-cfm-600 bg-white p-6 sm:p-7">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
