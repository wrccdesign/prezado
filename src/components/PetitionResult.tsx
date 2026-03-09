import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, FileText, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

interface PetitionResultProps {
  text: string;
  onNewPetition: () => void;
}

export function PetitionResult({ text, onNewPetition }: PetitionResultProps) {
  const { toast } = useToast();
  const [editedText, setEditedText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedText);
      toast({ title: "Copiado!", description: "Petição copiada para a área de transferência." });
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(editedText, 170);
    doc.setFontSize(12);
    let y = 20;
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 7;
    }
    doc.save("peticao.pdf");
    toast({ title: "PDF gerado com sucesso!" });
  };

  const handleDownloadDocx = async () => {
    const paragraphs = editedText.split("\n").map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
        })
    );
    const doc = new Document({
      sections: [{ children: paragraphs }],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "peticao.docx";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "DOCX gerado com sucesso!" });
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
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <FileText className="mr-1.5 h-4 w-4" />
            Baixar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadDocx}>
            <FileDown className="mr-1.5 h-4 w-4" />
            Baixar DOCX
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
        <CardContent>
          <textarea
            ref={textareaRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full min-h-[600px] resize-y rounded-md border border-input bg-background px-4 py-3 text-sm leading-relaxed font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ whiteSpace: "pre-wrap" }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
