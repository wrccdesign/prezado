import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Download } from "lucide-react";

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

  const handleDownload = () => {
    const blob = new Blob([editedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "peticao.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download iniciado!" });
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
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1.5 h-4 w-4" />
            Baixar .txt
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
