"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, RotateCcw } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function Verificacao2FAPage() {
  const router = useRouter();
  const [digits, setDigits] = React.useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS);
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    router.prefetch("/painel");
    inputsRef.current[0]?.focus();
  }, [router]);

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = clean;
      return next;
    });
    if (clean && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits((current) => {
      const next = [...current];
      pasted.split("").forEach((char, i) => (next[i] = char));
      return next;
    });
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== CODE_LENGTH) {
      setError("Introduza o código de 6 dígitos enviado ao seu dispositivo.");
      return;
    }
    setError("");
    setLoading(true);
    router.replace("/painel");
  }

  function handleResend() {
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array(CODE_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  }

  return (
    <AuthShell eyebrow="Verificação em duas etapas">
      <Link href="/login" className="mb-6 flex items-center gap-1.5 text-[13px] font-medium text-graphite-500 hover:text-graphite-800">
        <ArrowLeft className="size-3.5" /> Voltar ao início de sessão
      </Link>

      <div className="mb-5 flex size-11 items-center justify-center rounded-full bg-navy-50 text-navy-800">
        <ShieldCheck className="size-5" />
      </div>

      <h1 className="text-[22px] font-semibold tracking-tight text-graphite-900">Verificação de segurança</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-graphite-500">
        Introduza o código de 6 dígitos enviado por SMS para o número associado à sua conta institucional, terminado em •• 41.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && <Alert variant="destructive">{error}</Alert>}

        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              value={digit}
              onChange={(e) => setDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              aria-label={`Dígito ${index + 1} do código de verificação`}
              className="h-12 w-full rounded-md border border-graphite-300 bg-white text-center text-lg font-semibold tabular-nums text-graphite-900 transition-colors focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/15"
            />
          ))}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {loading ? "A verificar…" : "Confirmar código"}
        </Button>

        <div className="text-center text-[13px] text-graphite-500">
          {secondsLeft > 0 ? (
            <span>Pode reenviar o código em {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 font-medium text-navy-800 hover:underline"
            >
              <RotateCcw className="size-3.5" /> Reenviar código
            </button>
          )}
        </div>
      </form>

      <p className="mt-6 border-t border-graphite-150 pt-4 text-2xs leading-relaxed text-graphite-400">
        Por motivos de segurança institucional, nunca partilhe este código com terceiros. A equipa do SGE nunca solicitará este código por telefone ou e-mail.
      </p>
    </AuthShell>
  );
}
