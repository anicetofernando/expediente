"use client";

import * as React from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  ListTree,
  Plus,
  Printer,
  Redo2,
  Rows3,
  Table2,
  Columns3,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { DocumentTemplate } from "@/types";

interface LetterEditorHeader {
  issuingUnit?: string;
  issuingParentUnit?: string;
  recipientUnit?: string;
  recipientParentUnit?: string;
  reference?: string;
  subject?: string;
}

function uniqueLines(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values.filter((value): value is string => {
    const clean = value?.trim();
    if (!clean) return false;
    const key = clean.toLocaleLowerCase("pt-PT");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeMarkup(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

const tableCellStyle = "border:1px solid #cbd5e1;padding:6px 8px;min-width:90px";

export function LetterEditor({ value, onChange, title = "Carta institucional", template, compact = false, header }: { value: string; onChange: (html: string) => void; title?: string; template?: DocumentTemplate; compact?: boolean; header?: LetterEditorHeader }) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const selectionRef = React.useRef<Range | null>(null);
  const { toast } = useToast();
  const [tableRows, setTableRows] = React.useState(3);
  const [tableColumns, setTableColumns] = React.useState(3);
  const [tableActive, setTableActive] = React.useState(false);
  const issuingLines = uniqueLines([header?.issuingParentUnit, header?.issuingUnit]);
  const displayedIssuingLines = issuingLines.length ? issuingLines : [template?.cabecalho ?? "Unidade emitente"];
  const recipientLines = uniqueLines([header?.recipientUnit, header?.recipientParentUnit]);
  const displayedRecipientLines = recipientLines.length ? recipientLines : ["Destinatario automatico"];
  const reference = header?.reference?.trim() || "gerada no protocolo";
  const subject = header?.subject?.trim() || title;

  React.useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && document.activeElement !== editor) editor.innerHTML = value;
  }, [value]);

  function emit() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function saveSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) {
      setTableActive(false);
      return;
    }
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
      setTableActive(Boolean(getTableContext(range.commonAncestorContainer)));
      return;
    }
    setTableActive(false);
  }

  function restoreSelection() {
    const selection = window.getSelection();
    editorRef.current?.focus();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  function command(name: string, argument?: string) {
    restoreSelection();
    document.execCommand(name, false, argument);
    emit();
    saveSelection();
  }

  function closestElement<T extends Element>(node: Node | null, predicate: (element: Element) => element is T) {
    const editor = editorRef.current;
    let current = node?.nodeType === Node.ELEMENT_NODE ? node as Element : node?.parentElement ?? null;
    while (current && current !== editor) {
      if (predicate(current)) return current;
      current = current.parentElement;
    }
    return null;
  }

  function getTableContext(node?: Node | null) {
    const selection = window.getSelection();
    const target = node ?? selection?.anchorNode ?? selectionRef.current?.commonAncestorContainer ?? null;
    const cell = closestElement<HTMLTableCellElement>(
      target,
      (element): element is HTMLTableCellElement => element instanceof HTMLTableCellElement,
    );
    const row = cell?.parentElement instanceof HTMLTableRowElement ? cell.parentElement : null;
    const table = closestElement<HTMLTableElement>(
      cell,
      (element): element is HTMLTableElement => element instanceof HTMLTableElement,
    );
    if (!cell || !row || !table) return null;
    return { cell, row, table };
  }

  function emptyCell(reference?: HTMLTableCellElement) {
    const cell = document.createElement(reference?.tagName.toLowerCase() === "th" ? "th" : "td") as HTMLTableCellElement;
    cell.setAttribute("style", reference?.getAttribute("style") || tableCellStyle);
    cell.innerHTML = "<br>";
    return cell;
  }

  function focusCell(cell: HTMLTableCellElement | null | undefined) {
    if (!cell) return;
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    selectionRef.current = range.cloneRange();
    setTableActive(true);
  }

  function runTableAction(action: (context: NonNullable<ReturnType<typeof getTableContext>>) => HTMLTableCellElement | null | undefined) {
    restoreSelection();
    const context = getTableContext();
    if (!context) {
      setTableActive(false);
      return;
    }
    const nextCell = action(context);
    emit();
    focusCell(nextCell);
    saveSelection();
  }

  function addTableRowAfter() {
    runTableAction(({ row, cell }) => {
      const nextRow = row.cloneNode(false) as HTMLTableRowElement;
      const cells = row.cells.length ? Array.from(row.cells) : [undefined];
      cells.forEach((cell) => nextRow.appendChild(emptyCell(cell)));
      row.after(nextRow);
      return nextRow.cells[cell.cellIndex] ?? nextRow.cells[0];
    });
  }

  function addTableColumnAfter() {
    runTableAction(({ table, row, cell }) => {
      const columnIndex = cell.cellIndex;
      let focusTarget: HTMLTableCellElement | null = null;
      Array.from(table.rows).forEach((currentRow) => {
        const reference = currentRow.cells[Math.min(columnIndex, currentRow.cells.length - 1)] ?? cell;
        const nextCell = emptyCell(reference);
        if (currentRow.cells[columnIndex]) currentRow.cells[columnIndex].after(nextCell);
        else currentRow.appendChild(nextCell);
        if (currentRow === row) focusTarget = nextCell;
      });
      return focusTarget;
    });
  }

  function deleteTableRow() {
    runTableAction(({ table, row }) => {
      if (table.rows.length <= 1) {
        const previous = table.previousElementSibling;
        const next = table.nextElementSibling;
        table.remove();
        if (previous instanceof HTMLElement) previous.focus();
        if (next instanceof HTMLElement) next.focus();
        setTableActive(false);
        return null;
      }
      const nextRow = row.nextElementSibling instanceof HTMLTableRowElement ? row.nextElementSibling : row.previousElementSibling;
      const nextCell = nextRow instanceof HTMLTableRowElement ? nextRow.cells[0] : null;
      row.remove();
      return nextCell;
    });
  }

  function deleteTableColumn() {
    runTableAction(({ table, row, cell }) => {
      const columnIndex = cell.cellIndex;
      const maxColumns = Math.max(0, ...Array.from(table.rows).map((currentRow) => currentRow.cells.length));
      if (maxColumns <= 1) {
        table.remove();
        setTableActive(false);
        return null;
      }
      let focusTarget: HTMLTableCellElement | null = null;
      Array.from(table.rows).forEach((currentRow) => {
        const removable = currentRow.cells[columnIndex];
        const candidate = currentRow.cells[columnIndex + 1] ?? currentRow.cells[columnIndex - 1] ?? null;
        if (currentRow === row) focusTarget = candidate;
        removable?.remove();
      });
      return focusTarget;
    });
  }

  function deleteTable() {
    runTableAction(({ table }) => {
      table.remove();
      setTableActive(false);
      return null;
    });
  }

  function findClosestList(node: Node | null) {
    const editor = editorRef.current;
    let current = node?.nodeType === Node.ELEMENT_NODE ? node as Element : node?.parentElement ?? null;
    while (current && current !== editor) {
      if (current.tagName === "OL" || current.tagName === "UL") return current as HTMLOListElement | HTMLUListElement;
      current = current.parentElement;
    }
    return null;
  }

  function applyList(type: "decimal" | "lower-alpha" | "disc") {
    const ordered = type !== "disc";
    command(ordered ? "insertOrderedList" : "insertUnorderedList");
    const selection = window.getSelection();
    const list = findClosestList(selection?.anchorNode ?? null);
    if (list) {
      list.style.listStyleType = type;
      list.style.paddingLeft = "1.5rem";
    }
    emit();
  }

  function insertHtml(html: string) {
    restoreSelection();
    const inserted = document.execCommand("insertHTML", false, html);
    if (!inserted) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const templateElement = document.createElement("template");
        templateElement.innerHTML = html;
        range.deleteContents();
        range.insertNode(templateElement.content);
      }
    }
    emit();
    saveSelection();
  }

  function insertTable() {
    const rows = Math.min(12, Math.max(1, tableRows || 1));
    const columns = Math.min(8, Math.max(1, tableColumns || 1));
    const cells = Array.from({ length: columns }, () => `<td style="${tableCellStyle}"><br></td>`).join("");
    const body = Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join("");
    insertHtml(`<table style="width:100%;border-collapse:collapse;margin:12px 0"><tbody>${body}</tbody></table><p><br></p>`);
  }

  function print() {
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      toast({
        title: "Não foi possível imprimir",
        description: "O browser bloqueou a janela de impressão. Autorize pop-ups para este site e tente novamente.",
        variant: "destructive",
      });
      return;
    }
    const logoHeader = template?.logotipo && template.logotipoPosicao === "cabecalho" ? `<img src="${template.logotipo}" style="display:block;width:100%;max-width:170mm;margin:0 auto 4mm">` : "";
    const logoFooter = template?.logotipo && template.logotipoPosicao === "rodape" ? `<img src="${template.logotipo}" style="display:block;max-height:14mm;max-width:35mm;margin:0 auto 3mm">` : "";
    const issuerHtml = displayedIssuingLines.map((line) => `<span>${escapeMarkup(line)}</span>`).join("");
    const recipientHtml = displayedRecipientLines.map((line, index) => `<span class="${index === 0 ? "recipient-name" : "recipient-parent"}">${escapeMarkup(line)}</span>`).join("");
    popup.document.write(`<!doctype html><html><head><title>${title}</title><style>@page{size:A4;margin:20mm}*{box-sizing:border-box}body{font:12pt Arial;line-height:1.5;overflow-wrap:anywhere}header{margin-bottom:10mm}.issuer{text-align:center;color:#198754;font-size:10pt;font-weight:700;text-transform:uppercase;line-height:1.25;margin-bottom:4mm}.issuer span{display:block}.routing{display:grid;grid-template-columns:1.05fr .95fr;min-height:22mm;border:1.3px solid #1f2937;margin-bottom:2.5mm}.routing-left{border-right:1.3px solid #1f2937;padding:3mm 4mm;line-height:1.25}.routing-label{display:block;font-weight:700;text-transform:uppercase}.recipient-name{display:block;margin-top:2mm;font-weight:700;text-transform:uppercase}.recipient-parent{display:block;margin-top:1mm;font-size:9.5pt;text-transform:uppercase}.routing-right{display:flex;justify-content:center;padding:3mm 4mm;font-weight:700;text-decoration:underline}.ref-line{display:flex;justify-content:space-between;gap:6mm;font-size:10pt}.subject{font-size:11pt}.subject strong{text-decoration:underline}ol,ul{padding-left:7mm}table{width:100%;border-collapse:collapse;margin:4mm 0}td,th{border:1px solid #cbd5e1;padding:2mm;vertical-align:top}footer{text-align:center;border-top:1px solid #ccd3dc;padding-top:4mm;margin-top:12mm;color:#667085;font-size:9pt}</style></head><body><header>${logoHeader}<div class="issuer">${issuerHtml}</div><div class="routing"><div class="routing-left"><span class="routing-label">EXMO. SENHOR:</span>${recipientHtml}</div><div class="routing-right">Despacho</div></div><div class="ref-line"><span>N/Ref.: ${escapeMarkup(reference)}</span><span>Data: actual</span></div><div class="subject"><strong>Assunto:</strong> ${escapeMarkup(subject)}</div></header>${editorRef.current?.innerHTML ?? ""}<footer>${logoFooter}${template?.rodape ?? "Correspondencia institucional"}</footer></body></html>`);
    popup.document.close();
    // document.write numa popup ja aberta nem sempre dispara onload de forma
    // fiavel entre browsers -- um pequeno atraso garante que o conteudo ja
    // esta pronto antes de accionar a impressao.
    const win: Window = popup;
    let printed = false;
    function triggerPrint() {
      if (printed || win.closed) return;
      printed = true;
      win.focus();
      win.print();
    }
    win.onload = triggerPrint;
    window.setTimeout(triggerPrint, 300);
  }

  const tools = [
    ["Negrito", "bold", Bold], ["Itálico", "italic", Italic], ["Sublinhado", "underline", Underline],
    ["Alinhar à esquerda", "justifyLeft", AlignLeft], ["Centrar", "justifyCenter", AlignCenter],
    ["Alinhar à direita", "justifyRight", AlignRight], ["Justificar", "justifyFull", AlignJustify],
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
        <button type="button" title="Marcadores" aria-label="Lista com marcadores" onMouseDown={(event) => event.preventDefault()} onClick={() => applyList("disc")} className="flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50"><List className="size-3.5" /></button>
        <button type="button" title="Numeração" aria-label="Lista numerada" onMouseDown={(event) => event.preventDefault()} onClick={() => applyList("decimal")} className="flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50"><ListOrdered className="size-3.5" /></button>
        <button type="button" title="Alíneas" aria-label="Lista por alíneas" onMouseDown={(event) => event.preventDefault()} onClick={() => applyList("lower-alpha")} className="flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50"><ListTree className="size-3.5" /></button>
        <button type="button" title="Diminuir recuo" aria-label="Diminuir recuo" onMouseDown={(event) => event.preventDefault()} onClick={() => command("outdent")} className="flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50"><IndentDecrease className="size-3.5" /></button>
        <button type="button" title="Aumentar recuo" aria-label="Aumentar recuo" onMouseDown={(event) => event.preventDefault()} onClick={() => command("indent")} className="flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50"><IndentIncrease className="size-3.5" /></button>
        <label className="ml-1 flex h-7 items-center gap-1 border border-graphite-300 px-1.5 text-2xs text-graphite-500">Cor <input type="color" defaultValue="#1f2937" onChange={(event) => command("foreColor", event.target.value)} className="size-5 border-0 bg-transparent p-0" /></label>
        <span className="mx-1 h-5 w-px bg-graphite-250" />
        <input aria-label="Linhas da tabela" title="Linhas" type="number" min={1} max={12} value={tableRows} onChange={(event) => { const next = Number(event.target.value); setTableRows(Number.isFinite(next) ? next : 1); }} className="h-7 w-12 border border-graphite-300 bg-white px-1 text-center text-xs text-graphite-700" />
        <span className="text-xs text-graphite-400">x</span>
        <input aria-label="Colunas da tabela" title="Colunas" type="number" min={1} max={8} value={tableColumns} onChange={(event) => { const next = Number(event.target.value); setTableColumns(Number.isFinite(next) ? next : 1); }} className="h-7 w-12 border border-graphite-300 bg-white px-1 text-center text-xs text-graphite-700" />
        <button type="button" title="Inserir tabela" aria-label="Inserir tabela" onMouseDown={(event) => event.preventDefault()} onClick={insertTable} className="flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50"><Table2 className="size-3.5" /></button>
        <button type="button" disabled={!tableActive} title={tableActive ? "Adicionar linha abaixo" : "Clique numa celula da tabela"} aria-label="Adicionar linha abaixo" onMouseDown={(event) => event.preventDefault()} onClick={addTableRowAfter} className={cn("relative flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50 disabled:cursor-not-allowed disabled:opacity-35", !tableActive && "hover:border-transparent hover:bg-transparent")}><Rows3 className="size-3.5" /><Plus className="absolute bottom-1 right-1 size-2.5" /></button>
        <button type="button" disabled={!tableActive} title={tableActive ? "Adicionar coluna a direita" : "Clique numa celula da tabela"} aria-label="Adicionar coluna a direita" onMouseDown={(event) => event.preventDefault()} onClick={addTableColumnAfter} className={cn("relative flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50 disabled:cursor-not-allowed disabled:opacity-35", !tableActive && "hover:border-transparent hover:bg-transparent")}><Columns3 className="size-3.5" /><Plus className="absolute bottom-1 right-1 size-2.5" /></button>
        <button type="button" disabled={!tableActive} title={tableActive ? "Eliminar linha" : "Clique numa celula da tabela"} aria-label="Eliminar linha" onMouseDown={(event) => event.preventDefault()} onClick={deleteTableRow} className={cn("relative flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50 disabled:cursor-not-allowed disabled:opacity-35", !tableActive && "hover:border-transparent hover:bg-transparent")}><Rows3 className="size-3.5" /><Trash2 className="absolute bottom-1 right-1 size-2.5" /></button>
        <button type="button" disabled={!tableActive} title={tableActive ? "Eliminar coluna" : "Clique numa celula da tabela"} aria-label="Eliminar coluna" onMouseDown={(event) => event.preventDefault()} onClick={deleteTableColumn} className={cn("relative flex size-7 items-center justify-center border border-transparent text-graphite-600 hover:border-graphite-300 hover:bg-graphite-50 disabled:cursor-not-allowed disabled:opacity-35", !tableActive && "hover:border-transparent hover:bg-transparent")}><Columns3 className="size-3.5" /><Trash2 className="absolute bottom-1 right-1 size-2.5" /></button>
        <button type="button" disabled={!tableActive} title={tableActive ? "Eliminar tabela" : "Clique numa celula da tabela"} aria-label="Eliminar tabela" onMouseDown={(event) => event.preventDefault()} onClick={deleteTable} className={cn("relative flex size-7 items-center justify-center border border-transparent text-crimson-700 hover:border-crimson-200 hover:bg-crimson-50 disabled:cursor-not-allowed disabled:opacity-35", !tableActive && "text-graphite-600 hover:border-transparent hover:bg-transparent")}><Table2 className="size-3.5" /><Trash2 className="absolute bottom-1 right-1 size-2.5" /></button>
        <span className="mx-1 h-5 w-px bg-graphite-250" />
        <button type="button" title="Desfazer" onMouseDown={(e) => e.preventDefault()} onClick={() => command("undo")} className="flex size-7 items-center justify-center text-graphite-600 hover:bg-graphite-50"><Undo2 className="size-3.5" /></button>
        <button type="button" title="Refazer" onMouseDown={(e) => e.preventDefault()} onClick={() => command("redo")} className="flex size-7 items-center justify-center text-graphite-600 hover:bg-graphite-50"><Redo2 className="size-3.5" /></button>
        <button type="button" title="Imprimir pré-visualização" onClick={print} className="ml-auto flex size-7 items-center justify-center text-graphite-600 hover:bg-graphite-50"><Printer className="size-3.5" /></button>
      </div>
      <div className={cn("overflow-auto p-4 sm:p-7", compact ? "h-[62vh] min-h-[520px] max-h-[720px]" : "h-[78vh] min-h-[720px] max-h-[920px]")}>
        <div className={cn("mx-auto w-full max-w-[794px] bg-white px-[9%] py-[8%] shadow-card", compact ? "min-h-[720px]" : "min-h-[1123px]")}>
          <div className="mb-8 text-graphite-900">
            {template?.logotipo && template.logotipoPosicao === "cabecalho" ? (
              <img src={template.logotipo} alt="Logótipo" className="mx-auto w-full max-w-[520px] object-contain" />
            ) : (
              <p className="whitespace-pre-line text-center text-[11px] font-bold uppercase text-cfm-900">{template?.cabecalho ?? "CFM - Portos e Caminhos de Ferro de Mocambique"}</p>
            )}
            <div className="mt-3 text-center text-[11px] font-semibold uppercase leading-tight text-success-700">
              {displayedIssuingLines.map((line) => <p key={line}>{line}</p>)}
            </div>
            <div className="mt-4 grid min-h-24 grid-cols-[1.05fr_.95fr] border border-graphite-700 text-[11px] leading-tight">
              <div className="border-r border-graphite-700 p-3 text-left">
                <p className="font-semibold uppercase">EXMO. SENHOR:</p>
                {displayedRecipientLines.map((line, index) => (
                  <p key={line} className={cn(index === 0 ? "mt-3 font-semibold" : "mt-1", "uppercase")}>{line}</p>
                ))}
              </div>
              <div className="p-3 text-center font-semibold underline">Despacho</div>
            </div>
            <div className="mt-3 flex justify-between gap-4 text-[11px] text-graphite-700">
              <span>N/Ref.: {reference}</span>
              <span>Data: actual</span>
            </div>
            <p className="mt-1 text-[11px]"><strong className="underline">Assunto:</strong> {subject}</p>
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
            onFocus={saveSelection}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            className={cn("letter-editor min-h-[820px] text-[13px] leading-6 text-graphite-800 outline-none", "empty:before:pointer-events-none empty:before:text-graphite-350 empty:before:content-[attr(data-placeholder)]")}
          />
          <div className="mt-8 border-t border-graphite-200 pt-4 text-center text-2xs text-graphite-500">
            {template?.logotipo && template.logotipoPosicao === "rodape" && <img src={template.logotipo} alt="Logótipo" className="mx-auto mb-2 max-h-14 max-w-36 object-contain" />}
            <p className="whitespace-pre-line">{template?.rodape ?? "Correspondência institucional"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
