import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import mammoth from "mammoth";
import { PDFDocument, PDFFont, PDFPage, ParseSpeeds, StandardFonts, degrees, rgb } from "pdf-lib";
import { loadFileByPathname } from "@/lib/file-storage";
import type { DocumentTemplate } from "@/types";

const execFileAsync = promisify(execFile);
const outputCache = new Map<string, Buffer>();

export interface PdfFreePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_DECISION_NOTE_POSITION: PdfFreePosition = { x: 7, y: 70, width: 86, height: 12 };
const DEFAULT_REFERENCE_POSITION: PdfFreePosition = { x: 58, y: 8, width: 34, height: 6 };
const PDF_HEADER = "%PDF-";

export interface PdfStampMetadata {
  id?: string;
  nome: string;
  posicao?: string;
  aplicadoPor?: string;
  aplicadoEm?: string;
  imagemUrl?: string;
  posicaoLivre?: PdfFreePosition;
}

export interface PdfSignatureMetadata {
  id?: string;
  proprietario: string;
  cargo?: string;
  aplicadoPor?: string;
  aplicadoEm?: string;
  imagemUrl?: string;
  posicaoLivre?: PdfFreePosition;
}

export interface PdfReferenceMetadata {
  texto: string;
  label?: string;
  aplicadoPor?: string;
  aplicadoEm?: string;
  posicaoLivre?: PdfFreePosition;
}

export interface PdfDocumentInput {
  name: string;
  mimeType: string | null;
  contentHtml: string | null;
  sourceFile: Buffer | null;
  protocol: string;
  subject: string;
  stamps: PdfStampMetadata[];
  signatures: PdfSignatureMetadata[];
  template: Partial<DocumentTemplate> | null;
  institutionName?: string;
  watermark?: string;
  /** Departamento/unidade de quem emite este documento em concreto (mostrado
   * no cabecalho, por baixo do logotipo). */
  issuingUnit?: string;
  issuingParentUnit?: string | null;
  /** Unidade destinataria deste documento em concreto. Para o documento
   * principal vem do destinatario escolhido pelo remetente; para notas vem do
   * destinatario escolhido pela Secretaria/fluxo. */
  recipientUnit?: string | null;
  recipientParentUnit?: string | null;
  /** Numero de referencia proprio deste documento (nota/despacho), diferente
   * do protocolo do expediente. So' notas e despachos tem numeracao propria. */
  documentNumber?: string | null;
  documentKind?: string;
  /** Texto de decisao (aprovacao/rejeicao) escrito pelo proprio chefe/director
   * ao marcar directamente carimbo+assinatura na nota ou no expediente -- sem
   * isto, a marca fica so' com carimbo/assinatura, sem nenhuma justificacao
   * visivel de quem decidiu e porque. So' se aplica as duas formas directas
   * (nao ao despacho, que ja' e' um documento de texto livre proprio). */
  decisionNote?: { texto: string; autor: string; cargo?: string; data?: string; posicaoLivre?: PdfFreePosition } | null;
  /** Referencia/protocolo posicionado sobre documentos importados. */
  reference?: PdfReferenceMetadata | null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function plainText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, " ");
}

function formattedDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
}

function formattedShortDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

function isPdfInput(input: Pick<PdfDocumentInput, "name" | "mimeType" | "sourceFile">) {
  const mime = input.mimeType?.toLowerCase().split(";", 1)[0].trim();
  if (mime === "application/pdf" || mime === "application/x-pdf") return true;
  if (input.name.toLowerCase().endsWith(".pdf")) return true;
  return input.sourceFile?.subarray(0, PDF_HEADER.length).toString("latin1") === PDF_HEADER;
}

function decisionAttribution(note: NonNullable<PdfDocumentInput["decisionNote"]>) {
  return `${escapeHtml(note.autor)}${note.cargo ? ` - ${escapeHtml(note.cargo)}` : ""}${note.data ? `, ${escapeHtml(note.data)}` : ""}`;
}

function decisionNoteMarkup(note: NonNullable<PdfDocumentInput["decisionNote"]>, className: string, position?: PdfFreePosition) {
  const style = position ? ` style="left:${position.x}%;top:${position.y}%;width:${position.width}%;height:${position.height}%;"` : "";
  return `<section class="${className}"${style}><p>${escapeHtml(note.texto).replace(/\r?\n/g, "<br>")}</p><span>${decisionAttribution(note)}</span></section>`;
}

function referenceMarkup(reference: PdfReferenceMetadata, className: string, position?: PdfFreePosition) {
  const style = position ? ` style="left:${position.x}%;top:${position.y}%;width:${position.width}%;height:${position.height}%;"` : "";
  return `<section class="${className}"${style}><strong>${escapeHtml(reference.texto)}</strong></section>`;
}

function uniqueDisplayLines(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const value of values) {
    const clean = value?.trim();
    if (!clean) continue;
    const key = clean.toLocaleLowerCase("pt-PT");
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(clean);
  }
  return lines;
}

async function browserExecutable() {
  const candidates = process.platform === "win32"
    ? [
        path.join(process.env["PROGRAMFILES(X86)"] ?? "", "Microsoft", "Edge", "Application", "msedge.exe"),
        path.join(process.env.PROGRAMFILES ?? "", "Microsoft", "Edge", "Application", "msedge.exe"),
        path.join(process.env["PROGRAMFILES(X86)"] ?? "", "Google", "Chrome", "Application", "chrome.exe"),
        path.join(process.env.PROGRAMFILES ?? "", "Google", "Chrome", "Application", "chrome.exe"),
      ]
    : ["/usr/bin/microsoft-edge", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Tenta o próximo navegador disponível.
    }
  }
  throw new Error("Nao foi encontrado um navegador compativel para gerar o PDF.");
}

async function freePositionedImage(imagemUrl: string, posicao: PdfFreePosition, label: string) {
  const bytes = await loadAssetBytes(imagemUrl);
  if (!bytes) return "";
  const mime = /\.jpe?g$/i.test(imagemUrl) ? "image/jpeg" : "image/png";
  const src = `data:${mime};base64,${bytes.toString("base64")}`;
  return `<img class="free-position" alt="${escapeHtml(label)}" src="${src}" style="left:${posicao.x}%;top:${posicao.y}%;width:${posicao.width}%;height:${posicao.height}%;">`;
}

async function decorations(input: PdfDocumentInput) {
  const blocks: string[] = [];
  const freePositioned: string[] = [];
  for (const stamp of input.stamps) {
    if (stamp.imagemUrl && stamp.posicaoLivre) {
      freePositioned.push(await freePositionedImage(stamp.imagemUrl, stamp.posicaoLivre, stamp.nome));
    } else {
      blocks.push(`<section class="stamp"><strong>${escapeHtml(stamp.nome)}</strong><span>${escapeHtml(input.protocol)}</span><small>Aplicado por ${escapeHtml(stamp.aplicadoPor ?? "Sistema")} ${escapeHtml(formattedDate(stamp.aplicadoEm))}</small></section>`);
    }
  }
  for (const signature of input.signatures) {
    if (signature.imagemUrl && signature.posicaoLivre) {
      freePositioned.push(await freePositionedImage(signature.imagemUrl, signature.posicaoLivre, signature.proprietario));
    } else {
      blocks.push(`<section class="signature"><span class="signature-mark">Assinado digitalmente</span><strong>${escapeHtml(signature.proprietario)}</strong><span>${escapeHtml(signature.cargo ?? "")}</span><small>Validado no sistema ${escapeHtml(formattedDate(signature.aplicadoEm))}</small></section>`);
    }
  }
  const footer = blocks.length ? `<footer class="document-validations">${blocks.join("")}</footer>` : "";
  return footer + freePositioned.join("");
}

async function printableHtml(input: PdfDocumentInput, body: string) {
  const footerText = escapeHtml(input.template?.rodape ?? "Correspondência institucional").replace(/\r?\n/g, "<br>");
  const logo = input.template?.logotipo?.startsWith("data:image/") ? input.template.logotipo : "";
  const headerLogo = logo && input.template?.logotipoPosicao === "cabecalho" ? `<img class="brand-logo header-logo" src="${logo}" alt="Logótipo">` : "";
  const footerLogo = logo && input.template?.logotipoPosicao === "rodape" ? `<img class="brand-logo footer-logo" src="${logo}" alt="Logótipo">` : "";
  // Sem logotipo configurado, mantem-se o nome da instituicao como banner de texto
  // (fallback minimo) -- com logotipo, o proprio grafismo ja identifica a CFM.
  const textBanner = headerLogo
    ? ""
    : `<strong class="institutional-name">${escapeHtml(input.template?.cabecalho ?? input.institutionName ?? "CFM — Portos e Caminhos de Ferro de Moçambique").replace(/\r?\n/g, "<br>")}</strong>`;
  const issuingLines = uniqueDisplayLines([input.issuingParentUnit, input.issuingUnit]);
  const issuingUnitBlock = issuingLines.length
    ? `<div class="issuing-unit">${issuingLines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</div>`
    : "";
  const recipientLines = uniqueDisplayLines([input.recipientUnit, input.recipientParentUnit]);
  const routingPanel = recipientLines.length
    ? `<div class="routing-panel"><div class="routing-recipient"><span class="recipient-label">EXMO. SENHOR:</span>${recipientLines.map((line, index) => `<span class="${index === 0 ? "recipient-name" : "recipient-parent"}">${escapeHtml(line)}</span>`).join("")}</div><div class="routing-dispatch">Despacho</div></div>`
    : "";
  // Nota/despacho tem numeracao propria (N/Refª) e refere-se sempre ao
  // expediente original -- essa referencia nunca pode ser editada nem apagada
  // por quem escreve, por isso fica fixa aqui no cabecalho, nunca no corpo.
  const hasOwnNumber = Boolean(input.documentNumber) && input.documentKind !== "principal";
  const refLine = hasOwnNumber
    ? `<div class="ref-line"><span>N/Refª: ${escapeHtml(input.documentNumber!)}</span><span>Data: ${formattedShortDate(new Date())}</span></div><div class="related-expedient">Refere-se ao Expediente: <strong>${escapeHtml(input.protocol)}</strong></div>`
    : `<div class="ref-line"><span>N/Refª: ${escapeHtml(input.protocol)}</span><span>Data: ${formattedShortDate(new Date())}</span></div>`;
  // Texto de decisao (aprovacao/rejeicao) escrito pelo proprio chefe/director
  // ao marcar directamente -- fica visivel logo a seguir ao conteudo, antes
  // do carimbo/assinatura, tal como uma anotacao manuscrita real ("Autorizo.
  // Nome, Cargo, Data").
  const decisionNoteHtml = input.decisionNote?.texto
    ? `<section class="decision-note"><p>${escapeHtml(input.decisionNote.texto).replace(/\r?\n/g, "<br>")}</p><span>${escapeHtml(input.decisionNote.autor)}${input.decisionNote.cargo ? ` — ${escapeHtml(input.decisionNote.cargo)}` : ""}${input.decisionNote.data ? `, ${escapeHtml(input.decisionNote.data)}` : ""}</span></section>`
    : "";
  const inlineDecisionNoteHtml = input.decisionNote?.texto && !input.decisionNote.posicaoLivre
    ? decisionNoteHtml
    : "";
  const freeDecisionNoteHtml = input.decisionNote?.texto && input.decisionNote.posicaoLivre
    ? decisionNoteMarkup(input.decisionNote, "free-position-text", input.decisionNote.posicaoLivre)
    : "";
  const freeReferenceHtml = input.reference?.texto && input.reference.posicaoLivre
    ? referenceMarkup(input.reference, "free-reference-text", input.reference.posicaoLivre)
    : "";
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${escapeHtml(input.name)}</title><style>
    @page{size:A4;margin:20mm 19mm 22mm}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#1f2937;font-family:Arial,Helvetica,sans-serif;font-size:11.5pt;line-height:1.55}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.brand-logo{display:block;object-fit:contain}.header-logo{width:100%;max-width:170mm;height:auto;margin:0 auto 3mm}.footer-logo{max-height:14mm;max-width:38mm;margin:0 auto 2mm}.institutional-header{margin:0 0 8mm;padding:0}.institutional-name{display:block;text-align:center;color:#102f56;font-size:10pt;letter-spacing:0;text-transform:uppercase;margin-bottom:5mm}.issuing-unit{text-align:center;color:#198754;font-size:10pt;font-weight:700;text-transform:uppercase;margin:0 0 4mm;line-height:1.25}.issuing-unit span{display:block}.routing-panel{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);min-height:22mm;border:1.3px solid #1f2937;margin-bottom:2.5mm}.routing-recipient{border-right:1.3px solid #1f2937;padding:3mm 4mm;line-height:1.25}.recipient-label{display:block;font-weight:700;text-transform:uppercase}.recipient-name{display:block;margin-top:2mm;font-weight:700;text-transform:uppercase}.recipient-parent{display:block;margin-top:1mm;font-size:9.5pt;text-transform:uppercase}.routing-dispatch{display:flex;align-items:flex-start;justify-content:center;padding:3mm 4mm;font-weight:700;text-decoration:underline}.ref-line{display:flex;justify-content:space-between;gap:6mm;margin-bottom:2mm;font-size:10pt;color:#1f2937}.related-expedient{margin-bottom:2mm;font-size:9pt;color:#354052}.subject-line{font-size:11pt}.subject-line strong{text-decoration:underline}.content{overflow-wrap:anywhere;margin-top:6mm}.content img{display:block;max-width:100%;height:auto;margin:0 auto}.content table{max-width:100%;border-collapse:collapse}.content td,.content th{padding:2mm;border:1px solid #cbd5e1}.decision-note{margin-top:12mm;padding:4mm 5mm;border:1px solid #cad1dc;border-left:3px solid #173f70;break-inside:avoid;page-break-inside:avoid}.decision-note p{margin:0 0 2mm;font-style:italic;white-space:pre-wrap;overflow-wrap:anywhere}.decision-note span{display:block;font-size:9pt;font-weight:700;color:#354052}.template-footer{margin-top:14mm;padding-top:4mm;border-top:1px solid #cad1dc;color:#687386;font-size:8pt;text-align:center;break-inside:avoid}.document-validations{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:8mm 12mm;margin-top:18mm;padding-top:8mm;break-inside:avoid;page-break-inside:avoid}.stamp{display:flex;min-width:58mm;max-width:78mm;transform:rotate(-2deg);flex-direction:column;gap:1mm;border:2px solid #173f70;padding:3mm 5mm;color:#173f70;text-align:center;text-transform:uppercase}.stamp strong{font-size:10pt}.stamp span{font-size:8pt}.stamp small{font-size:6.5pt;text-transform:none}.signature{display:flex;min-width:64mm;flex-direction:column;border-top:1px solid #354052;padding-top:3mm;text-align:center}.signature-mark{margin-bottom:2mm;color:#177047;font-size:7pt;font-weight:700;text-transform:uppercase}.signature strong{font-size:9pt}.signature span,.signature small{font-size:7pt;color:#596579}.free-position{position:fixed;object-fit:contain;pointer-events:none}.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-32deg);font-size:64pt;font-weight:800;letter-spacing:0;color:rgba(23,63,112,0.14);text-transform:uppercase;white-space:nowrap;pointer-events:none;z-index:0}
    .decision-note{padding:0;border:0;border-left:0}.free-position-text,.free-reference-text{position:fixed;overflow:hidden;pointer-events:none;color:#1f2937;line-height:1.25}.free-position-text{font-size:9pt}.free-position-text p{margin:0 0 1.5mm;font-style:italic;white-space:pre-wrap;overflow-wrap:anywhere}.free-position-text span{display:block;font-size:7.5pt;font-weight:700;color:#354052}.free-reference-text{font-size:8.5pt}.free-reference-text strong{display:block;font-weight:700;color:#173f70;white-space:pre-wrap;overflow-wrap:anywhere}
  </style></head><body>${input.watermark ? `<div class="watermark">${escapeHtml(input.watermark)}</div>` : ""}<header class="institutional-header">${headerLogo}${textBanner}${issuingUnitBlock}${routingPanel}${refLine}<div class="subject-line"><strong>Assunto:</strong> ${escapeHtml(input.subject)}</div></header><main class="content">${body}${inlineDecisionNoteHtml}</main><footer class="template-footer">${footerLogo}${footerText}</footer>${freeReferenceHtml}${freeDecisionNoteHtml}${await decorations(input)}</body></html>`;
}

async function renderHtmlPdfServerless(html: string) {
  const { default: chromium } = await import("@sparticuz/chromium");
  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMediaType("print");
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function renderHtmlPdfLocal(html: string) {
  const workDir = await mkdtemp(path.join(tmpdir(), "cfm-document-"));
  const htmlPath = path.join(workDir, "document.html");
  const pdfPath = path.join(workDir, "document.pdf");
  const userDataDir = path.join(workDir, "browser-profile");
  try {
    await writeFile(htmlPath, html, "utf8");
    const executable = await browserExecutable();
    await execFileAsync(executable, [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--print-to-pdf-no-header",
      `--user-data-dir=${userDataDir}`,
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ], { timeout: 30_000, windowsHide: true, maxBuffer: 1024 * 1024 });
    return await readFile(pdfPath);
  } finally {
    // No Windows o Edge por vezes ainda detem um lock sobre o proprio
    // "browser-profile" por instantes depois do processo terminar -- a
    // limpeza e' so' houseekeeping do SO, nao pode mascarar um PDF ja gerado.
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function renderHtmlPdf(html: string) {
  return process.env.VERCEL ? renderHtmlPdfServerless(html) : renderHtmlPdfLocal(html);
}

async function loadAssetBytes(imagemUrl: string) {
  const filename = imagemUrl.split("/").pop();
  if (!filename) return null;
  return loadFileByPathname("assets", filename);
}

async function embedFreePositionImage(pdf: PDFDocument, page: PDFPage, imagemUrl: string, posicaoLivre: PdfFreePosition) {
  const bytes = await loadAssetBytes(imagemUrl);
  if (!bytes) return;
  const isJpg = /\.jpe?g$/i.test(imagemUrl);
  const embedded = isJpg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const width = (posicaoLivre.width / 100) * pageWidth;
  const height = (posicaoLivre.height / 100) * pageHeight;
  const x = (posicaoLivre.x / 100) * pageWidth;
  const y = pageHeight - ((posicaoLivre.y / 100) * pageHeight) - height;
  page.drawImage(embedded, { x, y, width, height });
}

async function loadExistingPdfAsCleanDocument(bytes: Buffer) {
  let source: PDFDocument;
  try {
    source = await PDFDocument.load(bytes, { ignoreEncryption: false, parseSpeed: ParseSpeeds.Fastest, throwOnInvalidObject: false, updateMetadata: false });
  } catch {
    source = await PDFDocument.load(bytes, { ignoreEncryption: true, parseSpeed: ParseSpeeds.Fastest, throwOnInvalidObject: false, updateMetadata: false });
  }
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const pages = await pdf.copyPages(source, source.getPageIndices());
  for (const page of pages) pdf.addPage(page);
  return pdf;
}

function stampCoordinates(position: string | undefined, pageWidth: number, pageHeight: number) {
  const width = 190;
  const height = 58;
  const upper = position?.includes("superior") ?? true;
  const left = position?.includes("esquerda") ?? false;
  const centered = position === "centro";
  return {
    x: centered ? (pageWidth - width) / 2 : left ? 42 : pageWidth - width - 42,
    y: centered ? (pageHeight - height) / 2 : upper ? pageHeight - height - 54 : 54,
    width,
    height,
  };
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of plainText(text).split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawFreePositionedReference(page: PDFPage, reference: PdfReferenceMetadata, font: PDFFont) {
  const { width, height } = page.getSize();
  const position = reference.posicaoLivre ?? DEFAULT_REFERENCE_POSITION;
  const boxWidth = (position.width / 100) * width;
  const boxHeight = (position.height / 100) * height;
  const x = (position.x / 100) * width;
  const yTop = height - ((position.y / 100) * height);
  const maxLines = Math.max(1, Math.floor(boxHeight / 10));
  const lines = wrapText(reference.texto, font, 8.5, Math.max(40, boxWidth));
  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) visibleLines[visibleLines.length - 1] = `${visibleLines[visibleLines.length - 1].replace(/\s+$/, "")}...`;
  let cursor = yTop - 8;
  for (const line of visibleLines) {
    page.drawText(line, { x, y: cursor, size: 8.5, font, color: rgb(0.09, 0.25, 0.44), maxWidth: boxWidth });
    cursor -= 10;
  }
}

async function decorateExistingPdf(input: PdfDocumentInput) {
  if (!input.sourceFile) throw new Error("Ficheiro PDF indisponivel.");
  if (input.stamps.length === 0 && input.signatures.length === 0 && !input.watermark && !input.decisionNote?.texto && !input.reference?.texto) return input.sourceFile;
  const pdf = await loadExistingPdfAsCleanDocument(input.sourceFile);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  if (input.reference?.texto) {
    drawFreePositionedReference(pdf.getPages()[0], input.reference, bold);
  }
  if (input.decisionNote?.texto) {
    const page = pdf.getPages().at(-1)!;
    const { width, height } = page.getSize();
    const position = input.decisionNote.posicaoLivre ?? DEFAULT_DECISION_NOTE_POSITION;
    const boxWidth = (position.width / 100) * width;
    const boxHeight = (position.height / 100) * height;
    const x = (position.x / 100) * width;
    const yTop = height - ((position.y / 100) * height);
    const yBottom = yTop - boxHeight;
    const textWidth = Math.max(40, boxWidth - 4);
    const lines = wrapText(input.decisionNote.texto, italic, 9, textWidth);
    const attribution = [input.decisionNote.autor, input.decisionNote.cargo].filter(Boolean).join(" — ")
      + (input.decisionNote.data ? `, ${input.decisionNote.data}` : "");
    const maxLines = Math.max(1, Math.floor((boxHeight - 14) / 12));
    const visibleLines = lines.slice(0, maxLines);
    if (lines.length > maxLines) visibleLines[visibleLines.length - 1] = `${visibleLines[visibleLines.length - 1].replace(/\s+$/, "")}...`;
    let cursor = yTop - 10;
    for (const line of visibleLines) {
      page.drawText(line, { x, y: cursor, size: 9, font: italic, color: rgb(0.12, 0.16, 0.22), maxWidth: textWidth });
      cursor -= 12;
    }
    page.drawText(plainText(attribution), { x, y: Math.max(yBottom + 2, cursor - 1), size: 7.5, font: bold, color: rgb(0.21, 0.25, 0.32), maxWidth: textWidth });
  }
  if (input.watermark) {
    const label = plainText(input.watermark).toUpperCase();
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      const textWidth = bold.widthOfTextAtSize(label, 64);
      page.drawText(label, {
        x: width / 2 - textWidth / 2, y: height / 2, size: 64, font: bold,
        color: rgb(0.09, 0.25, 0.44), opacity: 0.14, rotate: degrees(32),
      });
    }
  }
  let fixedStampIndex = 0;
  for (const stamp of input.stamps) {
    if (stamp.imagemUrl && stamp.posicaoLivre) {
      await embedFreePositionImage(pdf, pdf.getPages().at(-1)!, stamp.imagemUrl, stamp.posicaoLivre);
    } else {
      const page = stamp.posicao?.includes("inferior") ? pdf.getPages().at(-1)! : pdf.getPages()[0];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const box = stampCoordinates(stamp.posicao, pageWidth, pageHeight);
      box.y -= fixedStampIndex * 72;
      fixedStampIndex += 1;
      page.drawRectangle({ ...box, borderColor: rgb(0.08, 0.24, 0.43), borderWidth: 2, opacity: 0.88 });
      page.drawText(plainText(stamp.nome).toUpperCase(), { x: box.x + 8, y: box.y + 37, size: 9, font: bold, color: rgb(0.08, 0.24, 0.43), maxWidth: box.width - 16 });
      page.drawText(plainText(input.protocol), { x: box.x + 8, y: box.y + 22, size: 7, font: regular, color: rgb(0.08, 0.24, 0.43), maxWidth: box.width - 16 });
      page.drawText(`Aplicado por ${plainText(stamp.aplicadoPor ?? "Sistema")} ${plainText(formattedDate(stamp.aplicadoEm))}`, { x: box.x + 8, y: box.y + 8, size: 5.5, font: regular, color: rgb(0.08, 0.24, 0.43), maxWidth: box.width - 16 });
    }
  }
  let fixedSignatureIndex = 0;
  for (const signature of input.signatures) {
    if (signature.imagemUrl && signature.posicaoLivre) {
      await embedFreePositionImage(pdf, pdf.getPages().at(-1)!, signature.imagemUrl, signature.posicaoLivre);
    } else {
      const page = pdf.getPages().at(-1)!;
      const { width } = page.getSize();
      const x = width - 235;
      const yOffset = fixedSignatureIndex * 110;
      fixedSignatureIndex += 1;
      page.drawLine({ start: { x, y: 94 + yOffset }, end: { x: width - 42, y: 94 + yOffset }, color: rgb(0.2, 0.25, 0.32), thickness: 0.8 });
      page.drawText("ASSINADO DIGITALMENTE", { x: x + 20, y: 77 + yOffset, size: 7, font: bold, color: rgb(0.08, 0.43, 0.27) });
      page.drawText(plainText(signature.proprietario), { x: x + 20, y: 62 + yOffset, size: 9, font: bold, color: rgb(0.15, 0.18, 0.24), maxWidth: 165 });
      page.drawText(plainText(signature.cargo ?? ""), { x: x + 20, y: 49 + yOffset, size: 7, font: regular, color: rgb(0.3, 0.35, 0.42), maxWidth: 165 });
      page.drawText(plainText(formattedDate(signature.aplicadoEm)), { x: x + 20, y: 37 + yOffset, size: 6, font: regular, color: rgb(0.3, 0.35, 0.42) });
    }
  }
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

async function bodyFromInput(input: PdfDocumentInput) {
  if (input.contentHtml) return input.contentHtml;
  if (!input.sourceFile) throw new Error("Conteudo do documento indisponivel.");
  if (input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || input.name.toLowerCase().endsWith(".docx")) {
    const converted = await mammoth.convertToHtml({ buffer: input.sourceFile });
    return converted.value;
  }
  if (input.mimeType?.startsWith("image/")) {
    return `<img alt="${escapeHtml(input.name)}" src="data:${escapeHtml(input.mimeType)};base64,${input.sourceFile.toString("base64")}">`;
  }
  return `<pre style="white-space:pre-wrap">${escapeHtml(input.sourceFile.toString("utf8"))}</pre>`;
}

/**
 * Assinatura de conteudo do PDF final (texto/ficheiro + carimbos/assinaturas/
 * modelo aplicados) -- identica sempre que nada disto mudou, o que permite
 * tanto a cache em memoria abaixo como o ETag exposto pela rota HTTP (evita
 * relancar o Chromium sem necessidade, que e' a parte lenta da geracao).
 */
export function pdfCacheKey(input: PdfDocumentInput) {
  return createHash("sha256")
    .update(input.contentHtml ?? input.sourceFile ?? "")
    .update(JSON.stringify({ protocol: input.protocol, stamps: input.stamps, signatures: input.signatures, template: input.template, institutionName: input.institutionName, watermark: input.watermark, issuingUnit: input.issuingUnit, issuingParentUnit: input.issuingParentUnit, recipientUnit: input.recipientUnit, recipientParentUnit: input.recipientParentUnit, documentNumber: input.documentNumber, documentKind: input.documentKind, decisionNote: input.decisionNote, reference: input.reference }))
    .digest("hex");
}

export async function createDocumentPdf(input: PdfDocumentInput) {
  const key = pdfCacheKey(input);
  const cached = outputCache.get(key);
  if (cached) return cached;
  const output = isPdfInput(input)
    ? await decorateExistingPdf(input)
    : await renderHtmlPdf(await printableHtml(input, await bodyFromInput(input)));
  if (outputCache.size >= 50) outputCache.delete(outputCache.keys().next().value!);
  outputCache.set(key, output);
  return output;
}
