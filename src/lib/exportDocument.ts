import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Footer } from "docx";
import QRCode from "qrcode";
import { cleanDocumentText } from "./documentText";

export interface ExportSection {
  heading: string;
  body: string; // use \n for line breaks / bullet lines
}

export const TRANSPARENCY_NOTE =
  "Nota de transparência: documento elaborado com apoio de inteligência artificial. Precedentes e normas citados foram conferidos em fontes oficiais (DataJud/CNJ, tribunais e legislação compilada) e o texto passou por revisão humana integral, sob responsabilidade técnica do subscritor.";

export interface VerificacaoInfo {
  /** URL que abre a calculadora gratuita com os mesmos parâmetros. */
  url: string;
  /** Data/hora ISO da geração. */
  geradoEm: string;
  /** Data/hora ISO da última sincronização dos índices (quando houver). */
  sincronizadoEm?: string;
  /** Fonte dos dados, como a calculadora mostra na tela. */
  fonte?: string;
}

export interface ExportOptions {
  transparencyNote?: boolean;
  verificacao?: VerificacaoInfo;
}

const FONTE_PADRAO = "séries oficiais do Banco Central (SGS)";
const CABECALHO_DIREITA = "Honorífico, calculadoras jurídicas gratuitas";

function dataBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
function dataHoraBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Linhas exatas do rodapé de verificação (sem a numeração de página). */
export function linhasRodapeVerificacao(v: VerificacaoInfo): [string, string] {
  const sinc = v.sincronizadoEm ? ` Índices sincronizados em ${dataHoraBR(v.sincronizadoEm)}.` : "";
  return [
    `Memória de cálculo gerada em ${dataBR(v.geradoEm)} no Honorífico (https://www.honorifico.com.br), com ${v.fonte || FONTE_PADRAO}.${sinc}`,
    `Conferir este cálculo: ${v.url}. O link abre a calculadora gratuita com os mesmos parâmetros, sem cadastro.`,
  ];
}

/** Monta a URL de conferência: só parâmetros numéricos do cálculo + atribuição do documento. */
export function urlConferencia(path: string, params: Record<string, string>) {
  const u = new URL(path, "https://www.honorifico.com.br");
  for (const [k, v] of Object.entries(params)) if (v !== "" && v != null) u.searchParams.set(k, v);
  u.searchParams.set("ref", "pdf");
  u.searchParams.set("utm_source", "memoria");
  u.searchParams.set("utm_medium", "documento");
  u.searchParams.set("utm_campaign", "conferir-calculo");
  return u.toString();
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "documento";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToPDF(title: string, sections: ExportSection[], filename: string, options: ExportOptions = {}) {
  title = cleanDocumentText(title);
  sections = sections.map((s) => ({ heading: cleanDocumentText(s.heading), body: cleanDocumentText(s.body) }));
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginY = 56;
  const v = options.verificacao;
  const bottomReserve = v ? 70 : 0;
  const contentWidth = pageWidth - marginX * 2;
  let y = marginY;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginY - bottomReserve) {
      doc.addPage();
      y = marginY;
    }
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  ensureSpace(titleLines.length * 20);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 20 + 8;

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleDateString("pt-BR"), marginX, y);
  doc.setTextColor(0);
  y += 18;

  for (const section of sections) {
    if (!section.body?.trim()) continue;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const hLines = doc.splitTextToSize(section.heading, contentWidth);
    ensureSpace(hLines.length * 16 + 6);
    doc.text(hLines, marginX, y);
    y += hLines.length * 16 + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const bodyLines = doc.splitTextToSize(section.body, contentWidth);
    for (const line of bodyLines) {
      ensureSpace(14);
      doc.text(line, marginX, y);
      y += 14;
    }
    y += 10;
  }

  if (options.transparencyNote) {
    doc.setDrawColor(200);
    ensureSpace(60);
    doc.line(marginX, y, marginX + contentWidth, y);
    y += 14;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(90);
    for (const line of doc.splitTextToSize(TRANSPARENCY_NOTE, contentWidth)) {
      ensureSpace(12);
      doc.text(line, marginX, y);
      y += 12;
    }
    doc.setTextColor(0);
  }

  if (v) {
    const [l1, l2] = linhasRodapeVerificacao(v);
    const qrSize = 62; // ~22 mm
    const total = doc.getNumberOfPages();
    let qr: string | null = null;
    try {
      qr = await QRCode.toDataURL(v.url, { margin: 0, width: 300, errorCorrectionLevel: "M" });
    } catch { qr = null; }
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(doc.splitTextToSize(title, contentWidth * 0.55)[0], marginX, 30);
      doc.text(CABECALHO_DIREITA, pageWidth - marginX, 30, { align: "right" });
      const isLast = i === total && !!qr;
      const fw = isLast ? contentWidth - qrSize - 12 : contentWidth;
      const lines = [...doc.splitTextToSize(l1, fw), ...doc.splitTextToSize(l2, fw), `Página ${i} de ${total}`];
      let fy = pageHeight - 24 - (lines.length - 1) * 10;
      for (const line of lines) { doc.text(line, marginX, fy); fy += 10; }
      if (isLast) {
        const qx = pageWidth - marginX - qrSize;
        const qy = pageHeight - 24 - qrSize - 4;
        doc.addImage(qr!, "PNG", qx, qy, qrSize, qrSize);
        doc.setFontSize(7);
        doc.text("Conferir este cálculo", qx + qrSize / 2, qy + qrSize + 9, { align: "center" });
      }
    }
    doc.setTextColor(0);
  }

  doc.save(filename);
}

export async function exportToDOCX(title: string, sections: ExportSection[], filename: string, options: ExportOptions = {}) {
  title = cleanDocumentText(title);
  sections = sections.map((s) => ({ heading: cleanDocumentText(s.heading), body: cleanDocumentText(s.body) }));
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: title, bold: true, size: 32 })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString("pt-BR"),
          italics: true,
          color: "666666",
          size: 18,
        }),
      ],
    }),
    new Paragraph({ children: [new TextRun("")] }),
  );

  for (const section of sections) {
    if (!section.body?.trim()) continue;
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: section.heading, bold: true, size: 26 })],
      }),
    );
    for (const line of section.body.split("\n")) {
      children.push(new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }));
    }
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }

  if (options.transparencyNote) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: TRANSPARENCY_NOTE, italics: true, color: "555555", size: 18 })],
      }),
    );
  }

  const footers = options.verificacao
    ? {
        default: new Footer({
          children: linhasRodapeVerificacao(options.verificacao).map(
            (t) => new Paragraph({ children: [new TextRun({ text: t, size: 16, color: "777777" })] }),
          ),
        }),
      }
    : undefined;
  const doc = new Document({ sections: [{ footers, children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, filename);
}
