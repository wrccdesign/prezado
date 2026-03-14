import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, FileText, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, Header, Footer } from "docx";

interface PetitionResultProps {
  text: string;
  petitionType: string;
  onNewPetition: () => void;
}

type LineType = "header" | "section-title" | "party" | "body" | "closing" | "empty";

interface ParsedLine {
  text: string;
  type: LineType;
}

const SECTION_TITLE_REGEX = /^(I+[\s.\-–—]+)?\s*((D[OAE]S?)\s+.{3,})$/i;
const HEADER_KEYWORDS = [
  "EXCELENTÍSSIM", "EXMO", "MERITÍSSIM", "JUÍZO", "TRIBUNAL", "VARA",
  "AO JUÍZO", "À VARA", "AO TRIBUNAL", "COMARCA"
];
const PARTY_KEYWORDS = ["AUTOR", "REQUERENTE", "RECLAMANTE", "RÉU", "REQUERIDO", "RECLAMADO", "IMPETRANTE", "IMPETRADO"];
const CLOSING_KEYWORDS = ["NESTES TERMOS", "PEDE DEFERIMENTO", "TERMOS EM QUE", "P. DEFERIMENTO", "RESPEITOSAMENTE"];

function classifyLine(line: string, index: number, totalLines: number, prevTypes: LineType[]): LineType {
  const trimmed = line.trim();
  if (!trimmed) return "empty";
  const upper = trimmed.toUpperCase();
  if (index < 8 && HEADER_KEYWORDS.some(k => upper.includes(k))) return "header";
  if (SECTION_TITLE_REGEX.test(trimmed) && trimmed === trimmed.toUpperCase() && trimmed.length < 80) return "section-title";
  const sectionPatterns = [/^(DOS?\s+FATOS|DA\s+FUNDAMENTA|DO\s+DIREITO|DOS?\s+PEDIDOS|DA\s+TUTELA|DO\s+VALOR|DA\s+CAUSA|DAS?\s+PROVAS|DA\s+COMPET|PRELIMINAR)/i];
  if (sectionPatterns.some(p => p.test(trimmed)) && trimmed.length < 80) return "section-title";
  if (PARTY_KEYWORDS.some(k => upper.includes(k)) && index < 20) return "party";
  if (index > totalLines - 15 && CLOSING_KEYWORDS.some(k => upper.includes(k))) return "closing";
  if (index > totalLines - 12 && prevTypes.length > 0 && prevTypes[prevTypes.length - 1] === "closing") return "closing";
  return "body";
}

function parsePetitionLines(text: string): ParsedLine[] {
  const lines = text.split("\n");
  const result: ParsedLine[] = [];
  const prevTypes: LineType[] = [];
  for (let i = 0; i < lines.length; i++) {
    const type = classifyLine(lines[i], i, lines.length, prevTypes);
    result.push({ text: lines[i], type });
    prevTypes.push(type);
  }
  return result;
}

function sanitizeFilename(str: string) {
  return str.replace(/[^a-zA-Z0-9À-ÿ]/g, "_").replace(/_+/g, "_");
}

function getDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getFormattedDate() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PetitionResult({ text, petitionType, onNewPetition }: PetitionResultProps) {
  const { toast } = useToast();
  const [editedText, setEditedText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const baseFilename = `Peticao_${sanitizeFilename(petitionType)}_${getDateString()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      toast({ title: "Copiado!", description: "Petição copiada para a área de transferência." });
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const handleDownloadPDF = () => {
    const parsed = parsePetitionLines(editedText);
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const mLeft = 30, mRight = 20, mTop = 30, mBottom = 20;
    const usableWidth = pageWidth - mLeft - mRight;
    const bodyIndent = 12.5;
    const dateStr = getFormattedDate();
    const warningText = "Gerado por Prezado.ai — Documento deve ser revisado por advogado habilitado";

    const addPageHeaderFooter = (d: jsPDF) => {
      d.setFont("times", "bold"); d.setFontSize(10);
      d.text("Prezado.ai", mLeft, 15);
      d.setFont("times", "normal"); d.setFontSize(9);
      d.text(dateStr, pageWidth - mRight, 15, { align: "right" });
      d.setDrawColor(150); d.line(mLeft, 18, pageWidth - mRight, 18);
      d.setFontSize(7); d.setFont("times", "italic");
      d.text(warningText, pageWidth / 2, pageHeight - 8, { align: "center" });
    };

    addPageHeaderFooter(doc);
    let y = mTop;

    const checkPage = (needed: number) => {
      if (y + needed > pageHeight - mBottom - 12) { doc.addPage(); addPageHeaderFooter(doc); y = mTop; }
    };

    for (const line of parsed) {
      const trimmed = line.text.trim();
      if (line.type === "empty") { y += 4; continue; }
      if (line.type === "header") {
        doc.setFont("times", "bold"); doc.setFontSize(13);
        const wrapped = doc.splitTextToSize(trimmed, usableWidth);
        for (const wl of wrapped) { checkPage(6); doc.text(wl, pageWidth / 2, y, { align: "center" }); y += 6; }
        continue;
      }
      if (line.type === "section-title") {
        y += 4; doc.setFont("times", "bold"); doc.setFontSize(12); checkPage(8);
        doc.text(trimmed.toUpperCase(), pageWidth / 2, y, { align: "center" }); y += 8; continue;
      }
      if (line.type === "party") {
        doc.setFont("times", "bold"); doc.setFontSize(12);
        const wrapped = doc.splitTextToSize(trimmed, usableWidth);
        for (const wl of wrapped) { checkPage(6); doc.text(wl, mLeft, y); y += 6; }
        continue;
      }
      if (line.type === "closing") {
        doc.setFont("times", "normal"); doc.setFontSize(12); checkPage(6);
        doc.text(trimmed, pageWidth - mRight, y, { align: "right" }); y += 6; continue;
      }
      doc.setFont("times", "normal"); doc.setFontSize(12);
      const bodyWidth = usableWidth - bodyIndent;
      const wrapped = doc.splitTextToSize(trimmed, bodyWidth);
      for (let wi = 0; wi < wrapped.length; wi++) {
        checkPage(6);
        const xPos = wi === 0 ? mLeft + bodyIndent : mLeft;
        const lineWidth = wi === 0 ? bodyWidth : usableWidth;
        doc.text(wrapped[wi], xPos, y, { maxWidth: lineWidth, align: wi === 0 ? "left" : "justify" }); y += 6;
      }
    }

    y += 10; checkPage(30);
    doc.setFont("times", "normal"); doc.setFontSize(12);
    doc.text("___________________________________________", pageWidth / 2, y, { align: "center" }); y += 6;
    doc.text("Advogado(a) / OAB", pageWidth / 2, y, { align: "center" });

    doc.save(`${baseFilename}.pdf`);
    toast({ title: "Documento baixado com sucesso!" });
  };

  const handleDownloadDocx = async () => {
    const parsed = parsePetitionLines(editedText);
    const docParagraphs: Paragraph[] = [];

    for (const line of parsed) {
      const trimmed = line.text.trim();
      if (line.type === "empty") { docParagraphs.push(new Paragraph({ children: [], spacing: { after: 120 } })); continue; }
      if (line.type === "header") {
        docParagraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, font: "Times New Roman", size: 26, bold: true })], alignment: AlignmentType.CENTER, spacing: { line: 360, after: 60 } }));
        continue;
      }
      if (line.type === "section-title") {
        docParagraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed.toUpperCase(), font: "Times New Roman", size: 24, bold: true })], alignment: AlignmentType.CENTER, spacing: { line: 360, before: 240, after: 120 } }));
        continue;
      }
      if (line.type === "party") {
        docParagraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, font: "Times New Roman", size: 24, bold: true })], alignment: AlignmentType.JUSTIFIED, spacing: { line: 360 }, indent: { firstLine: 709 } }));
        continue;
      }
      if (line.type === "closing") {
        docParagraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, font: "Times New Roman", size: 24 })], alignment: AlignmentType.RIGHT, spacing: { line: 360 } }));
        continue;
      }
      docParagraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, font: "Times New Roman", size: 24 })], alignment: AlignmentType.JUSTIFIED, spacing: { line: 360 }, indent: { firstLine: 709 } }));
    }

    docParagraphs.push(new Paragraph({ children: [], spacing: { before: 400 } }));
    docParagraphs.push(new Paragraph({ children: [new TextRun({ text: "___________________________________________", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER }));
    docParagraphs.push(new Paragraph({ children: [new TextRun({ text: "Advogado(a) / OAB", font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }));

    const docFile = new Document({
      sections: [{
        properties: { page: { margin: { top: 1701, left: 1701, bottom: 1134, right: 1134 } } },
        headers: {
          default: new Header({
            children: [new Paragraph({
              children: [
                new TextRun({ text: "Prezado.ai", font: "Times New Roman", size: 20, bold: true }),
                new TextRun({ text: `    ${getFormattedDate()}`, font: "Times New Roman", size: 18 }),
              ],
              alignment: AlignmentType.LEFT,
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              children: [new TextRun({
                text: "Gerado por Prezado.ai — Documento deve ser revisado por advogado habilitado",
                font: "Times New Roman", size: 16, italics: true,
              })],
              alignment: AlignmentType.CENTER,
            })],
          }),
        },
        children: docParagraphs,
      }],
    });

    const blob = await Packer.toBlob(docFile);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseFilename}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Documento baixado com sucesso!" });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground">Petição Gerada</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-1.5 h-4 w-4" />
            Copiar
          </Button>
          <Button size="sm" onClick={onNewPetition}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Petição
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            Edite o texto abaixo conforme necessário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full min-h-[600px] resize-y rounded-md border border-input bg-background px-4 py-3 text-sm leading-relaxed font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ whiteSpace: "pre-wrap" }}
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownloadPDF} className="bg-[hsl(220,60%,30%)] hover:bg-[hsl(220,60%,25%)] text-white" size="lg">
              <FileText className="mr-2 h-5 w-5" />
              📄 Baixar PDF
            </Button>
            <Button onClick={handleDownloadDocx} className="bg-[hsl(210,70%,55%)] hover:bg-[hsl(210,70%,48%)] text-white" size="lg">
              <FileDown className="mr-2 h-5 w-5" />
              📝 Baixar DOCX
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
