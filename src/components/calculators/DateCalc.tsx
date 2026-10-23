import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { somarDiasUteis, diferencaDatas, ehDiaUtil, feriadosNacionais, type DiaDescartado } from "@/lib/date";
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
  const [aviso, setAviso] = useState<string | null>(null);
  const [descartados, setDescartados] = useState<DiaDescartado[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});

  const calcular = () => {
    const e: Record<string, string> = {};
    if (!data1) e.data1 = "Informe a data";
    if (modo === "somar" && Number.isNaN(parseInt(dias, 10))) e.dias = "Informe a quantidade de dias";
    if (modo === "diferenca" && !data2) e.data2 = "Informe a data final";
    setErros(e);
    setAviso(null);
    setDescartados([]);
    if (Object.keys(e).length) { setResultado(null); return; }
    const d1 = parseISO(data1);
    if (modo === "somar") {
      const n = parseInt(dias, 10);
      let final: Date;
      if (tipoDias === "uteis") {
        const r = somarDiasUteis(d1, n);
        final = r.final;
        setDescartados(r.descartados);
      } else final = addDays(d1, n);
      setResultado(format(final, "dd/MM/yyyy (EEEE)", { locale: ptBR }));
    } else if (modo === "diferenca") {
      const d2 = parseISO(data2);
      const r = diferencaDatas(d1, d2);
      if (r.invertido) setAviso("A data final é anterior à inicial. O resultado aparece com sinal negativo.");
      setResultado(`${r.corridos} dias corridos, ${r.uteis} dias úteis (sem fins de semana e feriados nacionais)`);
    } else {
      // converter: mostra info sobre a data
      const feriado = feriadosNacionais(d1.getFullYear()).get(data1);
      const info = feriado ? `feriado nacional (${feriado})` : ehDiaUtil(d1) ? "dia útil" : "fim de semana";
      setResultado(`${format(d1, "dd/MM/yyyy (EEEE)", { locale: ptBR })}, ${info}`);
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
          <Label htmlFor="datas-operacao">Operação</Label>
          <Select value={modo} onValueChange={v => { setModo(v as Modo); setResultado(null); setErros({}); setAviso(null); setDescartados([]); }}>
            <SelectTrigger id="datas-operacao"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="somar">Somar/subtrair dias</SelectItem>
              <SelectItem value="diferenca">Diferença entre datas</SelectItem>
              <SelectItem value="converter">Informações da data</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="datas-data1">{modo === "diferenca" ? "Data inicial" : "Data"}</Label>
          <Input id="datas-data1" aria-invalid={!!erros.data1} className="h-11" type="date" value={data1} onChange={e => setData1(e.target.value)} />
          {erros.data1 && <p className="text-note text-destructive">{erros.data1}</p>}
        </div>

        {modo === "diferenca" && (
          <div className="space-y-2">
            <Label htmlFor="datas-data2">Data final</Label>
            <Input id="datas-data2" aria-invalid={!!erros.data2} className="h-11" type="date" value={data2} onChange={e => setData2(e.target.value)} />
            {erros.data2 && <p className="text-note text-destructive">{erros.data2}</p>}
          </div>
        )}

        {modo === "somar" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="datas-dias">Dias (negativo para subtrair)</Label>
              <Input id="datas-dias" aria-invalid={!!erros.dias} className="h-11" type="number" inputMode="decimal" placeholder="Ex: 15" value={dias} onChange={e => setDias(e.target.value)} />
              {erros.dias && <p className="text-note text-destructive">{erros.dias}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="datas-tipo">Tipo de dias</Label>
              <Select value={tipoDias} onValueChange={v => setTipoDias(v as "uteis" | "corridos")}>
                <SelectTrigger id="datas-tipo"><SelectValue /></SelectTrigger>
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
        Calcular
      </Button>

      {resultado && (
        <div className="rounded-lg border border-cream-dark bg-white">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-lg font-medium">{resultado}</p>
            <Button variant="outline" size="sm" onClick={copiar}>
              <Copy className="mr-1.5 h-4 w-4" /> Copiar
            </Button>
          </div>
          {aviso && <p className="px-5 pb-4 text-note text-navy">{aviso}</p>}
          {descartados.length > 0 && (
            <div className="border-t border-cream-dark px-5 py-4">
              <p className="text-note text-navy/70">Dias não computados</p>
              <ul className="mt-2 text-note text-navy/80">
                {descartados.map(d => <li key={d.data}>{d.data}, {d.motivo}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-navy/60">
        Dias úteis excluem sábados, domingos e feriados nacionais. Feriados estaduais, municipais e forenses não entram. Para prazos processuais completos (feriados do tribunal, suspensão de fim de ano, publicação no DJe), use a
        Calculadora de Prazo Processual.
      </p>
    </div>
  );
}
