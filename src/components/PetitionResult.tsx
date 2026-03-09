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
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 30;
    const marginRight = 20;
    const marginTop = 30;
    const marginBottom = 20;
    const usableWidth = pageWidth - marginLeft - marginRight;
    const footerText = "Documento gerado por JurisAI — Revisar antes do protocolo";
    const dateStr = getFormattedDate();

    const addHeaderFooter = (pageDoc: jsPDF) => {
      // Header
      pageDoc.setFont("times", "bold");
      pageDoc.setFontSize(10);
      pageDoc.text("JurisAI", marginLeft, 15);
      pageDoc.setFont("times", "normal");
      pageDoc.setFontSize(9);
      pageDoc.text(dateStr, pageWidth - marginRight, 15, { align: "right" });
      // Linha separadora do cabeçalho
      pageDoc.setDrawColor(150);
      pageDoc.line(marginLeft, 18, pageWidth - marginRight, 18);

      // Footer
      pageDoc.setFontSize(8);
      pageDoc.setFont("times", "italic");
      pageDoc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
    };

    doc.setFont("times", "normal");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(editedText, usableWidth);
    let y = marginTop;

    addHeaderFooter(doc);

    for (const line of lines) {
      if (y > pageHeight - marginBottom - 10) {
        doc.addPage();
        addHeaderFooter(doc);
        y = marginTop;
      }
      doc.text(line, marginLeft, y);
      y += 6;
    }

    doc.save(`${baseFilename}.pdf`);
    toast({ title: "Documento baixado com sucesso!" });
  };

  const handleDownloadDocx = async () => {
    const paragraphs = editedText.split("\n").map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: "Times New Roman",
              size: 24, // 12pt
            }),
          ],
          spacing: { line: 360 }, // 1.5 line spacing
        })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1134,    // 30mm in twips (30 * 567 / 15)
                left: 1134,
                bottom: 756,  // 20mm
                right: 756,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "JurisAI", font: "Times New Roman", size: 20, bold: true }),
                    new TextRun({ text: `    ${getFormattedDate()}`, font: "Times New Roman", size: 18 }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Documento gerado por JurisAI — Revisar antes do protocolo",
                      font: "Times New Roman",
                      size: 16,
                      italics: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
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
            <Button
              onClick={handleDownloadPDF}
              className="bg-[hsl(220,60%,30%)] hover:bg-[hsl(220,60%,25%)] text-white"
              size="lg"
            >
              <FileText className="mr-2 h-5 w-5" />
              📄 Baixar PDF
            </Button>
            <Button
              onClick={handleDownloadDocx}
              className="bg-[hsl(210,70%,55%)] hover:bg-[hsl(210,70%,48%)] text-white"
              size="lg"
            >
              <FileDown className="mr-2 h-5 w-5" />
              📝 Baixar DOCX
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
