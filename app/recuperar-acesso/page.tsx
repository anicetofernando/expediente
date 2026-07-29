"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, Send } from "lucide-react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RecoverAccessPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setSent(true);
    setLoading(false);
  }

  return (
    <AuthShell eyebrow="Recuperação de acesso">
      <Link href="/login" className="mb-6 flex items-center gap-1.5 text-[13px] font-medium text-graphite-500 hover:text-graphite-800">
        <ArrowLeft className="size-3.5" /> Voltar ao início de sessão
      </Link>

      {!sent ? (
        <>
          <h1 className="text-[22px] font-semibold tracking-tight text-graphite-900">Recuperar acesso</h1>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="recovery-email" required>E-mail institucional</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-graphite-400" />
                <Input id="recovery-email" type="email" placeholder="nome.apelido@cfm.co.mz" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {!loading && <Send className="size-3.5" aria-hidden />}
              {loading ? "A enviar…" : "Enviar ligação"}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success-50 text-success-600">
            <CheckCircle2 className="size-6" />
          </div>
          <h1 className="text-[19px] font-semibold text-graphite-900">Verifique o seu e-mail</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-graphite-500">
            Se a conta existir, as instruções foram enviadas para <span className="font-medium text-graphite-700">{email}</span>.
          </p>
          <Button variant="secondary" className="mt-6 w-full" asChild>
            <Link href="/login"><ArrowLeft className="size-3.5" aria-hidden /> Voltar ao início de sessão</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
