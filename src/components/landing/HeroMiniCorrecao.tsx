import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { readFunctionError } from "@/lib/usageLimit";
import { parseValorBR } from "@/lib/currency";

interface Linha { mes: string; indice: string; variacao: string; saldo: string }

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number) => `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const indiceLabel = (s: string) => (/ipca/i.test(s) ? "IPCA" : /legal/i.test(s) ? "Taxa Legal" : s);
const mesAtual = () => new Date().toISOString().slice(0, 7);

// Linhas reais da calculadora: R$ 10.000,00 de 01/2024 a 09/2024, IPCA (SGS 433)
const EXEMPLO = {
  total: 10330.53,
  linhas: [
    { mes: "08/2024", indice: "IPCA", variacao: "-0,02%", saldo: "R$ 10.285,28" },
    { mes: "09/2024", indice: "IPCA", variacao: "0,44%", saldo: "R$ 10.330,53" },
  ] as Linha[],
};

export function HeroMiniCorrecao({ bare = false }: { bare?: boolean } = {}) {
  const [valor, setValor] = useState("10000");
  const [ini, setIni] = useState("2024-01");
  const [fim, setFim] = useState("2024-09");
  const [total, setTotal] = useState(EXEMPLO.total);
  const [linhas, setLinhas] = useState<Linha[]>(EXEMPLO.linhas);
  const [calc, setCalc] = useState({ valor: 10000, ini: "2024-01", fim: "2024-09" });
  const [exemplo, setExemplo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const calcular = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseValorBR(valor);
    if (!(v > 0)) return setErro("Informe um valor positivo.");
    if (!ini || !fim) return setErro("Informe as datas inicial e final.");
    if (fim <= ini) return setErro("A data final deve ser posterior à data inicial.");
    setErro(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("calcular-atualizacao", {
        body: {
          valor: v, data_inicial: `${ini}-01`, data_final: `${fim}-01`, indice: "ipca", pro_rata: true,
          manter_indice_contratual: false, regime_juros: "legal_14905", tipo_juros: "simples", taxa_juros_mensal: 0,
          juros_data_inicial: null, juros_data_final: null, multa_percentual: 0, multa_incide_sobre_juros: false, honorarios_percentual: 0,
        },
      });
      if (error) { setErro((await readFunctionError(error, "Falha ao calcular")).message); return; }
      const r = data as { error?: string; valor_corrigido: number; memoria: Array<{ mes_ref: string; indice_utilizado: string; variacao_percentual: number; saldo_corrigido: number }> };
      if (r?.error) throw new Error(r.error);
      setTotal(r.valor_corrigido);
      setLinhas(r.memoria.slice(-2).map((l) => {
        const [y, m] = l.mes_ref.split("-");
        return { mes: `${m}/${y}`, indice: indiceLabel(l.indice_utilizado), variacao: pct(l.variacao_percentual), saldo: brl(l.saldo_corrigido) };
      }));
      setCalc({ valor: v, ini, fim });
      setExemplo(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao calcular");
    } finally {
      setLoading(false);
    }
  };

  const href = `/calculadoras/correcao-monetaria-juros-lei-14905?${new URLSearchParams({
    valor: String(calc.valor), data_inicial: `${calc.ini}-01`, data_final: `${calc.fim}-01`,
    indice: "ipca", pro_rata: "1", regime_juros: "legal_14905", tipo_juros: "simples",
  })}`;
  const [yi, mi] = calc.ini.split("-");
  const [yf, mf] = calc.fim.split("-");

  return (
    <div className={bare ? "" : "rounded-lg border border-cream-dark border-t-[3px] border-t-gold bg-white p-6 md:p-7"}>
      <h2 className={bare ? "sr-only" : "font-sans text-sm font-medium text-navy"}>Correção monetária e juros, Lei 14.905/2024</h2>
      <form onSubmit={calcular} className="mt-4 grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="mini-valor" className="text-note text-navy/70">Valor (R$)</Label>
          <Input id="mini-valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className="h-10 rounded tabular-nums" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mini-ini" className="text-note text-navy/70">Data inicial</Label>
          <Input id="mini-ini" type="month" value={ini} onChange={(e) => setIni(e.target.value)} className="h-10 rounded px-2 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mini-fim" className="text-note text-navy/70">Data final</Label>
          <Input id="mini-fim" type="month" value={fim} max={mesAtual()} onChange={(e) => setFim(e.target.value)} className="h-10 rounded px-2 text-sm" />
        </div>
        <Button type="submit" disabled={loading} className="col-span-2 h-10 bg-gold text-navy hover:bg-gold-light font-medium rounded">
          {loading ? "Calculando" : "Calcular"}
        </Button>
      </form>
      {erro && <p role="alert" className="text-note text-destructive mt-3">{erro}</p>}

      <div aria-live="polite" className="mt-5">
        <p className="font-sans text-3xl font-medium text-navy tabular-nums">{brl(total)}</p>
        <p className="text-note text-navy/60 mt-1">
          {exemplo ? "Exemplo: " : ""}saldo corrigido em {mf}/{yf}, a partir de {brl(calc.valor)} em {mi}/{yi}
        </p>
        <table className="mt-4 w-full text-sm tabular-nums">
          <thead>
            <tr className="text-left text-navy/60 border-b border-cream-dark">
              <th className="py-2 font-medium">Mês</th>
              <th className="py-2 font-medium">Índice</th>
              <th className="py-2 font-medium text-right">Variação</th>
              <th className="py-2 font-medium text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((r) => (
              <tr key={r.mes + r.saldo} className="border-b border-cream-dark text-navy">
                <td className="py-2">{r.mes}</td><td className="py-2">{r.indice}</td>
                <td className="py-2 text-right">{r.variacao}</td><td className="py-2 text-right">{r.saldo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link to={href} className="inline-block mt-4 text-sm font-medium text-navy border-b border-navy/30 hover:border-gold hover:text-gold transition-colors">
          Ver memória completa
        </Link>
      </div>
      <p className="text-note text-navy/55 mt-4">Fonte: séries do Banco Central (SGS 433 e 29543). Grátis e sem cadastro.</p>
    </div>
  );
}
