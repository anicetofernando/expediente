"use client";

import * as React from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, List, ListOrdered, Printer, Redo2, Underline, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LetterEditor({ value, onChange, title = "Carta institucional" }: { value: string; onChange: (html: string) => void; title?: string }) {
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && document.activeElement !== editor) editor.innerHTML = value;
  }, [value]);

  function emit() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function command(name: string, argument?: string) {
    editorRef.current?.focus();
    document.execCommand(name, false, argument);
    emit();
  }

  function print() {
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    popup.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font:12pt Arial;line-height:1.5;max-width:190mm;margin:15mm auto}@media print{body{margin:0}}</style></head><body>${editorRef.current?.innerHTML ?? ""}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  const tools = [
    ["Negrito", "bold", Bold], ["Itálico", "italic", Italic], ["Sublinhado", "underline", Underline],
    ["Alinhar à esquerda", "justifyLeft", AlignLeft], ["Centrar", "justifyCenter", AlignCenter],
    ["Alinhar à direita", "justifyRight", AlignRight], ["Justificar", "justifyFull", AlignJustify],
    ["Lista com pontos", "insertUnorderedList", List], ["Lista numerada", "insertOrderedList", ListOrdered],
  ] as const;

  return (
    <div className="overflow-hidden border border-graphite-300 bg-graphite-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-graphite-300 bg-white px-2 py-1.5" role="toolbar" aria-label="Formatação da carta">
        <select aria-label="Estilo do texto" defaultValue="p" onChange={(event) => command("formatBlock", event.target.value)} className="h-7 border border-graphite-300 bg-white px-2 text-xs text-graphite-700">
          <option value="p">Normal</option><option value="h1">Título 1</option><option value="h2">Título 2</option><option value="h3">Título 3</option><option value="blockquote">Citação</option>
        </select>
        <select aria-label="Tipo de letra" defaultValue="Arial" onChange={(event) => command("fontName", event.target.value)} className="h-7 border border-graphite-300 bg-white px-2 text-xs text-graphite-700">
          <option>Arial</option><option>Calibri</option><option>Georgia</option><option>Times New Roman</option><option>Verdana</option>
        </select>
        <select aria-label="Tamanho da letra" defaultValue="3" onChange={(event) => command("fontSize", event.target.value)} className="h-7 w-16 border border-graphite-300 bg-white px-1 text-xs text-graphite-700">
          <option value="2">10</option><option value="3">12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option>
        </select>
        <span className="mx-1 h-5 w-px bg-graphite-250" />
        {tools.map(([label, name, Icon]) => (
          <button key={name} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => command(name)} className="flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50"><Icon className="size-3.5" /></button>
        ))}
        <label className="ml-1 flex h-7 items-center gap-1 border border-graphite-300 px-1.5 text-2xs text-graphite-500">Cor <input type="color" defaultValue="#1f2937" onChange={(event) => command("foreColor", event.target.value)} className="size-5 border-0 bg-transparent p-0" /></label>
        <span className="mx-1 h-5 w-px bg-graphite-250" />
        <button type="button" title="Desfazer" onMouseDown={(e) => e.preventDefault()} onClick={() => command("undo")} className="flex size-7 items-center justify-center text-graphite-600 hover:bg-graphite-50"><Undo2 className="size-3.5" /></button>
        <button type="button" title="Refazer" onMouseDown={(e) => e.preventDefault()} onClick={() => command("redo")} className="flex size-7 items-center justify-center text-graphite-600 hover:bg-graphite-50"><Redo2 className="size-3.5" /></button>
        <button type="button" title="Imprimir pré-visualização" onClick={print} className="ml-auto flex size-7 items-center justify-center text-graphite-600 hover:bg-graphite-50"><Printer className="size-3.5" /></button>
      </div>
      <div className="max-h-[620px] overflow-auto p-4 sm:p-7">
        <div className="mx-auto min-h-[720px] w-full max-w-[794px] bg-white px-[9%] py-[8%] shadow-card">
          <div className="mb-8 border-b border-graphite-200 pb-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-cfm-900">CFM — Portos e Caminhos de Ferro de Moçambique</p>
            <p className="mt-1 text-2xs text-graphite-400">Correspondência institucional</p>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label="Conteúdo da carta"
            data-placeholder="Escreva a carta aqui…"
            onInput={emit}
            onBlur={emit}
            className={cn("letter-editor min-h-[560px] text-[13px] leading-6 text-graphite-800 outline-none", "empty:before:pointer-events-none empty:before:text-graphite-350 empty:before:content-[attr(data-placeholder)]")}
          />
        </div>
      </div>
    </div>
  );
}
