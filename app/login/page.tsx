"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";
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

  React.useEffect(() => {
    router.prefetch("/verificacao-2fa");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Introduza o e-mail e a palavra-passe.");
      return;
    }
    setError("");
    setLoading(true);
    router.replace("/verificacao-2fa");
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight text-cfm-900">Iniciar sessão</h1>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}

        <div>
          <Label htmlFor="email" required>E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-graphite-400" />
            <Input id="email" type="email" placeholder="nome.apelido@cfm.co.mz" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" required>Palavra-passe</Label>
            <Link href="/recuperar-acesso" className="mb-1.5 text-[13px] font-medium text-cfm-800 hover:underline">
              Esqueceu-se da palavra-passe?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-graphite-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              className="pl-9 pr-9"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-graphite-600"
              aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-graphite-600">
          <Checkbox checked={keepSignedIn} onCheckedChange={(v) => setKeepSignedIn(v === true)} />
          Manter sessão iniciada neste dispositivo
        </label>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {!loading && <LogIn className="size-3.5" aria-hidden />}
          {loading ? "A entrar…" : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-md border border-graphite-150 bg-graphite-25 px-3 py-2.5 text-2xs leading-relaxed text-graphite-500">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-graphite-400" aria-hidden />
        Ligação encriptada. Após a palavra-passe, ser-lhe-á pedido um código de verificação em duas etapas.
      </div>

      <p className="mt-4 text-center text-2xs text-graphite-400">Versão 1.0.0 · Sistema de Gestão de Expediente</p>
    </AuthShell>
  );
}
