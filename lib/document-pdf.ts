import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import mammoth from "mammoth";
import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
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
  const headerText = escapeHtml(input.template?.cabecalho ?? input.institutionName ?? "CFM — Portos e Caminhos de Ferro de Moçambique").replace(/\r?\n/g, "<br>");
  const footerText = escapeHtml(input.template?.rodape ?? "Correspondência institucional").replace(/\r?\n/g, "<br>");
  const logo = input.template?.logotipo?.startsWith("data:image/") ? input.template.logotipo : "";
  const headerLogo = logo && input.template?.logotipoPosicao === "cabecalho" ? `<img class="brand-logo header-logo" src="${logo}" alt="Logótipo">` : "";
  const footerLogo = logo && input.template?.logotipoPosicao === "rodape" ? `<img class="brand-logo footer-logo" src="${logo}" alt="Logótipo">` : "";
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${escapeHtml(input.name)}</title><style>
    @page{size:A4;margin:20mm 19mm 22mm}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#1f2937;font-family:Arial,Helvetica,sans-serif;font-size:11.5pt;line-height:1.55}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.brand-logo{display:block;object-fit:contain;margin-left:auto;margin-right:auto}.header-logo{max-height:20mm;max-width:48mm;margin-bottom:3mm}.footer-logo{max-height:14mm;max-width:38mm;margin-bottom:2mm}.institutional-header{margin:0 0 13mm;padding:0 0 5mm;border-bottom:1px solid #cad1dc;text-align:center}.institutional-header strong{display:block;color:#102f56;font-size:10pt;letter-spacing:.09em;text-transform:uppercase}.institutional-header span{display:block;margin-top:2mm;color:#687386;font-size:8.5pt}.content{overflow-wrap:anywhere}.content img{display:block;max-width:100%;height:auto;margin:0 auto}.content table{max-width:100%;border-collapse:collapse}.content td,.content th{padding:2mm;border:1px solid #cbd5e1}.template-footer{margin-top:14mm;padding-top:4mm;border-top:1px solid #cad1dc;color:#687386;font-size:8pt;text-align:center;break-inside:avoid}.document-validations{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:8mm 12mm;margin-top:18mm;padding-top:8mm;break-inside:avoid;page-break-inside:avoid}.stamp{display:flex;min-width:58mm;max-width:78mm;transform:rotate(-2deg);flex-direction:column;gap:1mm;border:2px solid #173f70;padding:3mm 5mm;color:#173f70;text-align:center;text-transform:uppercase}.stamp strong{font-size:10pt}.stamp span{font-size:8pt}.stamp small{font-size:6.5pt;text-transform:none}.signature{display:flex;min-width:64mm;flex-direction:column;border-top:1px solid #354052;padding-top:3mm;text-align:center}.signature-mark{margin-bottom:2mm;color:#177047;font-size:7pt;font-weight:700;text-transform:uppercase}.signature strong{font-size:9pt}.signature span,.signature small{font-size:7pt;color:#596579}.free-position{position:fixed;object-fit:contain;pointer-events:none}
  </style></head><body><header class="institutional-header">${headerLogo}<strong>${headerText}</strong><span>${escapeHtml(input.protocol)} · ${escapeHtml(input.subject)}</span></header><main class="content">${body}</main><footer class="template-footer">${footerLogo}${footerText}</footer>${await decorations(input)}</body></html>`;
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
    await rm(workDir, { recursive: true, force: true });
  }
}

async function renderHtmlPdf(html: string) {
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

async function decorateExistingPdf(input: PdfDocumentInput) {
  if (!input.sourceFile) throw new Error("Ficheiro PDF indisponivel.");
  if (input.stamps.length === 0 && input.signatures.length === 0) return input.sourceFile;
  const pdf = await PDFDocument.load(input.sourceFile, { ignoreEncryption: false });
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
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
  return Buffer.from(await pdf.save());
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

export async function createDocumentPdf(input: PdfDocumentInput) {
  const key = createHash("sha256")
    .update(input.contentHtml ?? input.sourceFile ?? "")
    .update(JSON.stringify({ protocol: input.protocol, stamps: input.stamps, signatures: input.signatures, template: input.template, institutionName: input.institutionName }))
    .digest("hex");
  const cached = outputCache.get(key);
  if (cached) return cached;
  const output = input.mimeType === "application/pdf"
    ? await decorateExistingPdf(input)
    : await renderHtmlPdf(await printableHtml(input, await bodyFromInput(input)));
  if (outputCache.size >= 50) outputCache.delete(outputCache.keys().next().value!);
  outputCache.set(key, output);
  return output;
}
