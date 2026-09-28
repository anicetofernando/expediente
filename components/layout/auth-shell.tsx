export function AuthShell({
  children,
}: {
  children: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="relative grid min-h-dvh overflow-hidden bg-cfm-900 lg:min-h-screen lg:grid-cols-[minmax(360px,38%)_1fr]">
      <aside className="relative hidden items-center justify-center overflow-hidden bg-cfm-900 lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_38%_42%,rgba(255,255,255,0.12),transparent_18rem),linear-gradient(90deg,rgba(4,31,19,0.82),rgba(16,91,54,0.82)),linear-gradient(180deg,rgba(7,54,32,0.24),rgba(4,31,19,0.72))]"
        />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[58%] opacity-45">
          <div className="absolute left-[18%] top-[13%] h-[34%] w-[48%] rounded-t-[42px] border border-cfm-300/20 bg-cfm-950/50 shadow-[0_0_80px_rgba(4,31,19,0.55)]" />
          <div className="absolute left-[23%] top-[4%] h-3 w-20 bg-cfm-950/55" />
          <div className="absolute left-[25%] top-[20%] size-4 rounded-full bg-amber-100/50 blur-[1px]" />
          <div className="absolute left-[34%] top-[20%] size-4 rounded-full bg-amber-100/50 blur-[1px]" />
          <div className="absolute bottom-[20%] left-[10%] h-px w-[78%] origin-left rotate-[11deg] bg-white/22" />
          <div className="absolute bottom-[12%] left-[8%] h-px w-[82%] origin-left rotate-[13deg] bg-white/16" />
          <div className="absolute bottom-[5%] left-[4%] h-20 w-[88%] bg-[repeating-linear-gradient(108deg,rgba(255,255,255,0.16)_0_1px,transparent_1px_22px)]" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,54,32,0.08),rgba(4,31,19,0.9))]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cfm-white.webp" alt="CFM" className="relative z-10 h-auto w-56 xl:w-64" />
      </aside>

      <main className="relative flex min-h-dvh items-center justify-center overflow-y-auto px-3 py-5 sm:px-5 sm:py-10 lg:min-h-screen">
        <div
          aria-hidden
          className="absolute inset-0 hidden bg-[radial-gradient(circle_at_54%_48%,rgba(255,255,255,0.96),rgba(244,247,249,0.88)_27rem,rgba(225,232,237,0.8)),linear-gradient(90deg,rgba(255,255,255,0.96),rgba(234,240,244,0.82)),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(211,220,227,0.66))] lg:block"
        />
        <div aria-hidden className="absolute inset-0 hidden opacity-45 lg:block">
          <div className="absolute left-[2%] top-[32%] h-[62%] w-[58%] rounded-[50%] border-l border-t border-graphite-300/70 blur-[0.2px]" />
          <div className="absolute left-[7%] top-[39%] h-[56%] w-[60%] rounded-[50%] border-l border-t border-white/80 blur-[0.2px]" />
          <div className="absolute bottom-[21%] left-[6%] h-px w-[44%] origin-left rotate-[22deg] bg-graphite-300/65" />
          <div className="absolute bottom-[16%] left-[5%] h-px w-[48%] origin-left rotate-[24deg] bg-white/90" />
          <div className="absolute bottom-[8%] left-[4%] h-24 w-[48%] origin-bottom -rotate-[4deg] bg-[repeating-linear-gradient(101deg,rgba(170,183,194,0.35)_0_1px,transparent_1px_24px)]" />
          <div className="absolute right-[12%] top-[42%] h-[24%] w-[1px] bg-graphite-300/40" />
          <div className="absolute right-[7%] top-[51%] h-[18%] w-[1px] bg-graphite-300/35" />
        </div>
        <div className="relative z-10 w-full max-w-[22rem] sm:max-w-sm lg:max-w-[34rem]">
          <div className="mb-5 flex justify-center sm:mb-6 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/cfm-white.webp" alt="CFM" className="h-auto w-40 sm:w-36" />
          </div>

          <div className="border border-graphite-200 border-t-2 border-t-cfm-600 bg-white/95 p-5 shadow-modal backdrop-blur-sm sm:p-7 lg:p-10 lg:shadow-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
