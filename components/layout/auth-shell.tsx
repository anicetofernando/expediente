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
        className="absolute inset-0 h-dvh w-full object-cover object-[36%_center] lg:h-screen lg:object-center"
      />
      <div aria-hidden className="absolute inset-0 bg-cfm-900/55 lg:hidden" />
      <div aria-hidden className="absolute inset-y-0 left-0 hidden w-[38%] bg-cfm-950/[0.90] lg:block" />
      <div aria-hidden className="absolute inset-y-0 right-0 hidden left-[38%] bg-white/[0.94] lg:block" />

      <aside className="relative hidden items-center justify-center overflow-hidden lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cfm-white.webp" alt="CFM" className="relative z-10 h-auto w-56 xl:w-64" />
      </aside>

      <main className="relative z-10 flex min-h-dvh items-center justify-center overflow-y-auto px-4 py-6 sm:px-5 sm:py-10 lg:min-h-screen lg:px-5 lg:py-10">
        <div className="w-full max-w-[20.75rem] sm:max-w-sm lg:max-w-[28rem]">
          <div className="mb-6 flex justify-center sm:mb-7 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cfm-white.webp" alt="CFM" className="h-auto w-40 sm:w-44" />
          </div>

          <div className="border border-graphite-200 border-t-2 border-t-cfm-600 bg-white/95 p-5 backdrop-blur-sm sm:p-7 lg:flex lg:min-h-[22rem] lg:flex-col lg:justify-center lg:p-9">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
