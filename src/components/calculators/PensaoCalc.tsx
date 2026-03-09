import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Moradia = "nao" | "sim" | "parcial";
type Padrao = "baixa" | "medio" | "alto";

interface Resultado {
  minimo: number;
  sugerido: number;
  maximo: number;
  porFilhoMin: number;
  porFilhoSug: number;
  porFilhoMax: number;
  percentualMin: number;
  percentualSug: number;
  percentualMax: number;
}

export function PensaoCalc() {
  const [renda, setRenda] = useState("");
  const [filhos, setFilhos] = useState("1");
  const [moradia, setMoradia] = useState<Moradia>("nao");
  const [outrasObrigacoes, setOutrasObrigacoes] = useState(false);
  const [padrao, setPadrao] = useState<Padrao>("medio");
  const [result, setResult] = useState<Resultado | null>(null);

  const calcular = () => {
    const r = parseFloat(renda) || 0;
    const f = Math.max(1, parseInt(filhos) || 1);
    if (r <= 0) {
      toast.error("Informe a renda líquida do alimentante.");
      return;
    }

    // Base percentages per number of children (STJ guidelines)
    let baseMin: number, baseSug: number, baseMax: number;
    if (f === 1) {
      baseMin = 0.15; baseSug = 0.20; baseMax = 0.25;
    } else if (f === 2) {
      baseMin = 0.25; baseSug = 0.30; baseMax = 0.35;
    } else if (f === 3) {
      baseMin = 0.30; baseSug = 0.35; baseMax = 0.40;
    } else {
      baseMin = 0.33; baseSug = 0.40; baseMax = 0.50;
    }

    // Living standard adjustment
    if (padrao === "baixa") {
      baseMin *= 0.90; baseSug *= 0.90; baseMax *= 0.95;
    } else if (padrao === "alto") {
      baseMin *= 1.05; baseSug *= 1.10; baseMax *= 1.10;
    }

    // Custody adjustment
    if (moradia === "sim") {
      baseMin *= 0.60; baseSug *= 0.60; baseMax *= 0.65;
    } else if (moradia === "parcial") {
      baseMin *= 0.75; baseSug *= 0.75; baseMax *= 0.80;
    }

    // Other obligations adjustment
    if (outrasObrigacoes) {
      baseMin *= 0.85; baseSug *= 0.88; baseMax *= 0.90;
    }

    // Cap at 50%
    baseMax = Math.min(baseMax, 0.50);
    baseSug = Math.min(baseSug, baseMax);
    baseMin = Math.min(baseMin, baseSug);

    const minimo = r * baseMin;
    const sugerido = r * baseSug;
    const maximo = r * baseMax;

    setResult({
      minimo, sugerido, maximo,
      porFilhoMin: minimo / f,
      porFilhoSug: sugerido / f,
      porFilhoMax: maximo / f,
      percentualMin: baseMin * 100,
      percentualSug: baseSug * 100,
      percentualMax: baseMax * 100,
    });
  };

  const gerarPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const r = parseFloat(renda) || 0;
    const f = parseInt(filhos) || 1;

    doc.setFontSize(16);
    doc.text("Relatório de Pensão Alimentícia — JurisAI", 14, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);

    doc.setFontSize(11);
    doc.text("Dados Informados:", 14, 40);
    doc.setFontSize(10);
    const dados = [
      `Renda líquida: ${fmt(r)}`,
      `Nº de filhos: ${f}`,
      `Filhos moram com alimentante: ${moradia === "nao" ? "Não" : moradia === "sim" ? "Sim" : "Parcialmente"}`,
      `Outras obrigações alimentares: ${outrasObrigacoes ? "Sim" : "Não"}`,
      `Padrão de vida: ${padrao === "baixa" ? "Baixa renda" : padrao === "medio" ? "Médio" : "Alto padrão"}`,
    ];
    dados.forEach((t, i) => doc.text(t, 14, 48 + i * 6));

    let y = 82;
    doc.setFontSize(11);
    doc.text("Faixa de Valores:", 14, y);
    y += 8;

    doc.setFontSize(10);
    const linhas = [
      ["Descrição", "Valor", "% da Renda"],
      ["Valor Mínimo", fmt(result.minimo), `${result.percentualMin.toFixed(1)}%`],
      ["Valor Sugerido", fmt(result.sugerido), `${result.percentualSug.toFixed(1)}%`],
      ["Valor Máximo", fmt(result.maximo), `${result.percentualMax.toFixed(1)}%`],
      ["Por Filho (sugerido)", fmt(result.porFilhoSug), "—"],
    ];

    linhas.forEach((row, i) => {
      const bold = i === 0;
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(row[0], 14, y);
      doc.text(row[1], 100, y);
      doc.text(row[2], 155, y);
      y += 7;
    });

    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Art. 1.694 CC: A pensão deve atender às necessidades do alimentando,", 14, y);
    doc.text("na proporção das possibilidades do alimentante.", 14, y + 5);
    y += 14;
    doc.text("Este é um valor de referência. O juiz decidirá com base nas necessidades", 14, y);
    doc.text("e possibilidades das partes.", 14, y + 5);

    doc.save("pensao-alimenticia-jurisai.pdf");
    toast.success("PDF gerado com sucesso!");
  };

  const moradiaLabel = moradia === "nao" ? "Não" : moradia === "sim" ? "Sim" : "Parcialmente (guarda compartilhada)";
  const padraoLabel = padrao === "baixa" ? "Baixa renda" : padrao === "medio" ? "Médio" : "Alto padrão";

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Renda Líquida do Alimentante (R$)</Label>
          <Input type="number" placeholder="5000" value={renda} onChange={e => setRenda(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Número de Filhos</Label>
          <Input type="number" min={1} placeholder="1" value={filhos} onChange={e => setFilhos(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Os filhos moram com o alimentante?</Label>
          <Select value={moradia} onValueChange={(v) => setMoradia(v as Moradia)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nao">Não</SelectItem>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="parcial">Parcialmente (guarda compartilhada)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Padrão de vida da família</Label>
          <Select value={padrao} onValueChange={(v) => setPadrao(v as Padrao)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa renda</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto padrão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={outrasObrigacoes} onCheckedChange={setOutrasObrigacoes} id="obrigacoes" />
        <Label htmlFor="obrigacoes">Alimentante tem outras obrigações alimentares?</Label>
      </div>

      <Button onClick={calcular} className="w-full sm:w-auto">Calcular Pensão</Button>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Highlighted suggested value */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6 text-center space-y-1">
              <p className="text-sm text-muted-foreground">Valor Sugerido</p>
              <p className="text-3xl font-bold text-primary">{fmt(result.sugerido)}</p>
              <p className="text-sm text-muted-foreground">({result.percentualSug.toFixed(1)}% da renda)</p>
            </CardContent>
          </Card>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">% da Renda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Faixa Mínima</TableCell>
                  <TableCell className="text-right">{fmt(result.minimo)}</TableCell>
                  <TableCell className="text-right">{result.percentualMin.toFixed(1)}%</TableCell>
                </TableRow>
                <TableRow className="bg-primary/5 font-semibold">
                  <TableCell>Valor Sugerido</TableCell>
                  <TableCell className="text-right">{fmt(result.sugerido)}</TableCell>
                  <TableCell className="text-right">{result.percentualSug.toFixed(1)}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Faixa Máxima</TableCell>
                  <TableCell className="text-right">{fmt(result.maximo)}</TableCell>
                  <TableCell className="text-right">{result.percentualMax.toFixed(1)}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Valor por Filho (sugerido)</TableCell>
                  <TableCell className="text-right">{fmt(result.porFilhoSug)}</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Legal explanation */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Como o juiz calcula a pensão?</p>
              <p>
                O valor da pensão alimentícia é definido pelo juiz com base no <strong>binômio necessidade × possibilidade</strong> (art. 1.694 do Código Civil). Isso significa que o juiz avalia quanto o alimentando precisa para manter suas necessidades básicas (alimentação, moradia, educação, saúde) e quanto o alimentante pode pagar sem comprometer seu próprio sustento.
              </p>
              <p>
                Na prática, a jurisprudência do STJ costuma fixar entre <strong>15% e 30%</strong> da renda líquida por filho, podendo variar conforme o padrão de vida, guarda compartilhada e outras obrigações do alimentante.
              </p>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Este é um valor de referência. O juiz decidirá com base nas necessidades e possibilidades das partes.
            </p>
          </div>

          {/* PDF */}
          <Button variant="outline" onClick={gerarPDF} className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" /> Gerar Relatório PDF
          </Button>
        </div>
      )}
    </div>
  );
}
