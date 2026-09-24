"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
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
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="password" required className="text-[13px] leading-5">Palavra-passe</Label>
            <Link href="/recuperar-acesso" className="mb-1.5 text-[14px] font-medium leading-5 text-cfm-800 hover:underline sm:text-right sm:text-[13px] sm:leading-4">
              Esqueceu-se da palavra-passe?
            </Link>
          </div>
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
        </div>

        <label htmlFor="keep-signed-in" className="flex cursor-pointer items-start gap-3 text-[14px] leading-5 text-graphite-600 sm:gap-2.5 sm:text-[13px]">
          <Checkbox
            id="keep-signed-in"
            checked={keepSignedIn}
            onCheckedChange={(v) => setKeepSignedIn(v === true)}
            className="mt-0.5 size-5 sm:size-4"
          />
          <span className="min-w-0">Manter sessão iniciada neste dispositivo</span>
        </label>

        <Button type="submit" className="h-11 w-full text-[15px] sm:h-8 sm:text-[13px]" size="lg" loading={loading}>
          {!loading && <LogIn className="size-3.5" aria-hidden />}
          {loading ? "A entrar…" : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
