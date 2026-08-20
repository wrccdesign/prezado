import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, CalendarDays } from "lucide-react";
import { format, parseISO, addDays, addBusinessDays, differenceInDays, differenceInBusinessDays, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

type Modo = "somar" | "diferenca" | "converter";

export function DateCalc() {
  const [modo, setModo] = useState<Modo>("somar");
  const [data1, setData1] = useState("");
  const [data2, setData2] = useState("");
  const [dias, setDias] = useState("");
  const [tipoDias, setTipoDias] = useState<"uteis" | "corridos">("uteis");
  const [resultado, setResultado] = useState<string | null>(null);

  const calcular = () => {
    if (!data1) {
      toast({ title: "Informe a data", variant: "destructive" });
      return;
    }
    const d1 = parseISO(data1);
    if (modo === "somar") {
      const n = parseInt(dias, 10);
      if (Number.isNaN(n)) {
        toast({ title: "Informe a quantidade de dias", variant: "destructive" });
        return;
      }
      const final = tipoDias === "uteis" ? addBusinessDays(d1, n) : addDays(d1, n);
      setResultado(format(final, "dd/MM/yyyy (EEEE)", { locale: ptBR }));
    } else if (modo === "diferenca") {
      if (!data2) {
        toast({ title: "Informe a segunda data", variant: "destructive" });
        return;
      }
      const d2 = parseISO(data2);
      const corridos = differenceInDays(d2, d1);
      const uteis = differenceInBusinessDays(d2, d1);
      setResultado(`${Math.abs(corridos)} dia(s) corridos · ${Math.abs(uteis)} dia(s) úteis`);
    } else {
      // converter: mostra info sobre a data
      const info = isWeekend(d1) ? "fim de semana" : "dia útil";
      setResultado(`${format(d1, "dd/MM/yyyy (EEEE)", { locale: ptBR })} — ${info}`);
    }
  };

  const copiar = () => {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado);
    toast({ title: "Copiado para a área de transferência" });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Operação</Label>
          <Select value={modo} onValueChange={v => { setModo(v as Modo); setResultado(null); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="somar">Somar/subtrair dias</SelectItem>
              <SelectItem value="diferenca">Diferença entre datas</SelectItem>
              <SelectItem value="converter">Informações da data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{modo === "diferenca" ? "Data inicial" : "Data"}</Label>
          <Input type="date" value={data1} onChange={e => setData1(e.target.value)} />
        </div>

        {modo === "diferenca" && (
          <div className="space-y-2">
            <Label>Data final</Label>
            <Input type="date" value={data2} onChange={e => setData2(e.target.value)} />
          </div>
        )}

        {modo === "somar" && (
          <>
            <div className="space-y-2">
              <Label>Dias</Label>
              <Input type="number" placeholder="Ex: 15" value={dias} onChange={e => setDias(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de dias</Label>
              <Select value={tipoDias} onValueChange={v => setTipoDias(v as "uteis" | "corridos")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uteis">Dias úteis</SelectItem>
                  <SelectItem value="corridos">Dias corridos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <Button onClick={calcular} className="h-11 w-full sm:w-auto">
        <CalendarDays className="mr-1.5 h-4 w-4" /> Calcular
      </Button>

      {resultado && (
        <Card>
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-lg font-semibold">{resultado}</p>
            <Button variant="outline" size="sm" onClick={copiar}>
              <Copy className="mr-1.5 h-4 w-4" /> Copiar
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Para cálculos processuais completos (feriados, recesso forense, publicação no DJe), use a
        Calculadora de Prazo Processual.
      </p>
    </div>
  );
}
