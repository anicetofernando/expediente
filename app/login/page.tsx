"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Input, Label } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [keepSignedIn, setKeepSignedIn] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Introduza o e-mail e a palavra-passe.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, persistent: keepSignedIn }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Não foi possível iniciar sessão.");
        return;
      }
      router.replace(result.redirectTo ?? "/painel");
      router.refresh();
    } catch {
      setError("Não foi possível ligar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-[22px] font-semibold leading-7 tracking-tight text-cfm-900 sm:text-xl">Iniciar sessão</h1>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        <div>
          <Label htmlFor="email" required className="text-[13px] leading-5">E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-graphite-400" />
            <Input id="email" type="email" placeholder="nome.apelido@cfm.co.mz" className="h-11 pl-10 text-[15px] sm:h-8 sm:pl-9 sm:text-[13px]" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
        </div>

        <div>
          <Label htmlFor="password" required className="text-[13px] leading-5">Palavra-passe</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-graphite-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              className="h-11 pl-10 pr-10 text-[15px] sm:h-8 sm:pl-9 sm:pr-9 sm:text-[13px]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-graphite-400 hover:text-graphite-600 sm:size-auto"
              aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Link href="/recuperar-acesso" className="mt-2 inline-flex text-[13px] font-medium leading-5 text-cfm-700 underline-offset-3 hover:text-cfm-900 hover:underline">
            Esqueci a palavra-passe
          </Link>
        </div>

        <label htmlFor="keep-signed-in" className="flex cursor-pointer items-center gap-2.5 text-[13px] leading-5 text-graphite-700">
          <Checkbox
            id="keep-signed-in"
            checked={keepSignedIn}
            onCheckedChange={(v) => setKeepSignedIn(v === true)}
            className="size-[18px] border-cfm-500 hover:border-cfm-700 focus-visible:ring-cfm-500/30 data-[state=checked]:border-cfm-700 data-[state=checked]:bg-cfm-700"
          />
          <span className="min-w-0">Manter sessão iniciada neste dispositivo</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full select-none items-center justify-center gap-2 rounded-sm border border-cfm-700 border-b-cfm-500 bg-cfm-700 px-4 text-[15px] font-semibold text-white transition-colors duration-100 hover:border-cfm-800 hover:border-b-cfm-600 hover:bg-cfm-800 active:border-cfm-900 active:bg-cfm-900 disabled:cursor-not-allowed disabled:border-graphite-200 disabled:bg-graphite-200 disabled:text-graphite-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cfm-500 sm:h-8 sm:text-[13px]"
          aria-busy={loading || undefined}
        >
          {loading && (
            <span
              className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden
            />
          )}
          {!loading && <LogIn className="size-3.5" aria-hidden />}
          {loading ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
