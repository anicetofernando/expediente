"use client";

import * as React from "react";
import { Lock, Send } from "lucide-react";
import type { Comment } from "@/types";
import { UserAvatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function CommentsPanel({ initialComments, expedientId }: { initialComments: Comment[]; expedientId: string }) {
  const { toast } = useToast();
  const [comments, setComments] = React.useState(initialComments);
  const [text, setText] = React.useState("");
  const [internal, setInternal] = React.useState(true);

  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/expedients/${expedientId}/comments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: text, internal }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível adicionar o comentário.");
      setComments((prev) => [...prev, result.comment]);
      setText("");
      toast({ title: "Comentário adicionado", variant: "success" });
    } catch (error) {
      toast({ title: "Comentário não guardado", description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-graphite-200 p-3.5">
        <Textarea rows={3} placeholder="Escreva um comentário sobre este processo…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-2.5 flex items-center justify-between">
          <label className="flex items-center gap-2 text-2xs text-graphite-500">
            <Checkbox checked={internal} onCheckedChange={(v) => setInternal(!!v)} />
            Comentário interno (não visível ao remetente)
          </label>
          <Button size="sm" disabled={!text.trim() || submitting} onClick={submit} loading={submitting}>
            <Send className="size-3.5" /> Comentar
          </Button>
        </div>
      </div>

      {comments.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Sem comentários" description="Ainda não existem comentários neste processo." />
      ) : (
        <ul className="space-y-4">
          {[...comments].reverse().map((c) => (
            <li key={c.id} className="flex gap-3">
              <UserAvatar name={c.autor} size="sm" />
              <div className="min-w-0 flex-1 rounded-lg border border-graphite-150 bg-graphite-25 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[13px] font-medium text-graphite-900">{c.autor}</span>
                  <span className="text-2xs text-graphite-400">{c.cargo}</span>
                  {c.interno && (
                    <span className="flex items-center gap-1 rounded bg-graphite-150 px-1.5 py-0.5 text-2xs text-graphite-500">
                      <Lock className="size-2.5" /> Interno
                    </span>
                  )}
                  <span className="ml-auto text-2xs text-graphite-400">{formatRelativeTime(c.data)}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-graphite-700">{c.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
