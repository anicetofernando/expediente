export function AuthShell({
  children,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="relative grid h-svh min-h-svh overflow-hidden bg-cfm-900 lg:h-screen lg:grid-cols-[minmax(360px,38%)_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-railway-bg.png"
        alt=""
        aria-hidden
        className="absolute inset-x-0 top-0 h-[38svh] w-full object-cover object-[8%_50%] lg:inset-0 lg:h-screen lg:object-center"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[38svh] bg-cfm-900/45 lg:hidden" />
      <div aria-hidden className="absolute inset-y-0 left-0 hidden w-[38%] bg-cfm-950/[0.90] lg:block" />
      <div aria-hidden className="absolute inset-y-0 right-0 hidden left-[38%] bg-white/[0.94] lg:block" />

      <aside className="relative hidden items-center justify-center overflow-hidden lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cfm-white.webp" alt="CFM" className="relative z-10 h-auto w-56 xl:w-64" />
      </aside>

      <main className="relative z-10 flex min-h-0 flex-col overflow-hidden lg:min-h-screen lg:items-center lg:justify-center lg:overflow-y-auto lg:px-5 lg:py-10">
        <div className="flex h-full w-full flex-col lg:h-auto lg:min-h-0 lg:max-w-[27rem]">
          <div className="flex h-[38svh] shrink-0 items-end justify-center pb-[clamp(1rem,3svh,2rem)] lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cfm-white.webp" alt="CFM" className="h-auto w-[clamp(8rem,42vw,12rem)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-t-[28px] bg-white/95 px-5 pb-5 pt-6 shadow-[0_-14px_36px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:h-auto sm:flex-none sm:px-8 sm:pb-10 sm:pt-10 lg:flex lg:min-h-[21.5rem] lg:flex-col lg:justify-center lg:rounded-none lg:border lg:border-graphite-200 lg:border-t-2 lg:border-t-cfm-600 lg:p-9 lg:shadow-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
