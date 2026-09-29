export function AuthShell({
  children,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="relative grid h-dvh min-h-dvh overflow-hidden bg-cfm-900 lg:h-screen lg:grid-cols-[minmax(360px,38%)_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-railway-bg.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-dvh w-full object-cover object-[34%_top] lg:h-screen lg:object-center"
      />
      <div aria-hidden className="absolute inset-0 bg-cfm-900/65 lg:hidden" />
      <div aria-hidden className="absolute inset-y-0 left-0 hidden w-[38%] bg-cfm-950/[0.90] lg:block" />
      <div aria-hidden className="absolute inset-y-0 right-0 hidden left-[38%] bg-white/[0.94] lg:block" />

      <aside className="relative hidden items-center justify-center overflow-hidden lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cfm-white.webp" alt="CFM" className="relative z-10 h-auto w-56 xl:w-64" />
      </aside>

      <main className="relative z-10 flex min-h-dvh flex-col overflow-y-auto lg:min-h-screen lg:items-center lg:justify-center lg:px-5 lg:py-10">
        <div className="flex min-h-dvh w-full flex-col lg:min-h-0 lg:max-w-[27rem]">
          <div className="flex h-[42dvh] min-h-[17rem] max-h-[22rem] items-end justify-center pb-[clamp(2.25rem,7dvh,4rem)] lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cfm-white.webp" alt="CFM" className="h-auto w-[clamp(10rem,48vw,14rem)]" />
          </div>

          <div className="min-h-[58dvh] rounded-t-[28px] bg-white/95 px-6 pb-8 pt-9 shadow-[0_-14px_36px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-8 sm:pb-10 sm:pt-10 lg:flex lg:min-h-[21.5rem] lg:flex-col lg:justify-center lg:rounded-none lg:border lg:border-graphite-200 lg:border-t-2 lg:border-t-cfm-600 lg:p-9 lg:shadow-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
