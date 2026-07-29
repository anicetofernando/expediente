export function AuthShell({
  children,
  eyebrow = "Gestão de Expediente",
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="grid min-h-screen bg-graphite-50 lg:grid-cols-[minmax(320px,38%)_1fr]">
      <aside className="relative hidden overflow-hidden bg-cfm-900 text-white lg:flex lg:flex-col">
        <div className="absolute inset-y-0 right-0 w-1 bg-cfm-400" aria-hidden />
        <div className="flex h-16 items-center border-b border-white/10 px-8">
          <span className="flex h-8 min-w-12 items-center justify-center border border-white/20 bg-white/5 px-2 text-[11px] font-bold tracking-wider">
            CFM
          </span>
          <span className="ml-3 border-l border-cfm-400 pl-3 text-xs font-medium tracking-wide text-cfm-100">
            SGE
          </span>
        </div>

        <div className="flex flex-1 items-center px-8 xl:px-12">
          <div>
            <span className="mb-5 block h-0.5 w-12 bg-cfm-400" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cfm-100">Sistema institucional</p>
            <h1 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight">
              Gestão de Expediente
            </h1>
          </div>
        </div>

        <div className="border-t border-white/10 px-8 py-5 text-[11px] text-cfm-200">
          Portos e Caminhos de Ferro de Moçambique
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-5 flex items-center gap-3 lg:hidden">
            <span className="flex h-9 min-w-12 items-center justify-center bg-cfm-900 px-2 text-[11px] font-bold tracking-wider text-white">
              CFM
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-cfm-900">CFM</span>
              <span className="block text-xs text-graphite-500">{eyebrow}</span>
            </span>
          </div>

          <div className="border border-graphite-200 border-t-2 border-t-cfm-600 bg-white p-6 sm:p-7">
            {children}
          </div>

          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.12em] text-graphite-400">
            Acesso institucional
          </p>
        </div>
      </main>
    </div>
  );
}
