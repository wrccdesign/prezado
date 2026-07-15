import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export interface ExportSection {
  heading: string;
  body: string; // use \n for line breaks / bullet lines
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

export function exportToPDF(title: string, sections: ExportSection[], filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginY = 56;
  const contentWidth = pageWidth - marginX * 2;
  let y = marginY;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - marginY) {
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

  doc.save(filename);
}

export async function exportToDOCX(title: string, sections: ExportSection[], filename: string) {
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

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, filename);
}
