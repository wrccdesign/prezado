import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { readFunctionError } from "@/lib/usageLimit";
import { notifyUsageConsumed } from "@/hooks/useUsage";


const PRAZOS_TIPO = [
  { id: "contestacao", label: "Contestação", dias: 15, materia: "civel" },
  { id: "apelacao", label: "Recurso de Apelação", dias: 15, materia: "civel" },
  { id: "embargos", label: "Embargos de Declaração", dias: 5, materia: "civel" },
  { id: "agravo", label: "Agravo de Instrumento", dias: 15, materia: "civel" },
  { id: "especial", label: "Recurso Especial/Extraordinário", dias: 15, materia: "civel" },
  { id: "recurso_ordinario", label: "Recurso Ordinário (trabalhista)", dias: 8, materia: "trabalhista" },
  { id: "apelacao_penal", label: "Apelação criminal", dias: 5, materia: "penal" },
  { id: "personalizado", label: "Prazo personalizado", dias: 0, materia: "civel" },
];

const UFS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const VARAS = [
  "Cível",
  "Consumidor",
  "Trabalho",
  "Federal",
  "Família",
  "Juizado Especial Cível",
  "Juizado Especial Federal",
  "Criminal",
  "Execução Fiscal",
  "Fazenda Pública",
  "Registros Públicos",
  "Outro",
];

interface Municipio {
  id: number;
  nome: string;
}

interface Tribunal {
  tribunal: string;
  nome_completo: string;
}

interface DiaExcluido { data: string; motivo: string; }

interface Resultado {
  data_referencia: string;
  tipo_data: string;
  data_publicacao: string;
  data_inicio_contagem: string;
  data_vencimento: string;
  dias_restantes: number;
  materia: string;
  contagem: string;
  dias_excluidos: DiaExcluido[];
  base_legal: string[];
}

const RECURSOS_COM_PREPARO = ["apelacao", "agravo", "recurso_ordinario", "apelacao_penal"];

function gerarICS(dataVencimento: string, dataPublicacao: string, tipoPrazo: string, uf: string): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toICSDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const venc = parseISO(dataVencimento);
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Honorífico//Prazo Processual//PT", "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${toICSDate(venc)}`,
    `DTEND;VALUE=DATE:${toICSDate(new Date(venc.getTime() + 86400000))}`,
    `DTSTAMP:${stamp}`, `UID:honorifico-prazo-${stamp}@honorifico.com.br`,
    `SUMMARY:Vencimento: ${tipoPrazo} (${uf})`,
    `DESCRIPTION:Prazo calculado pelo Honorífico.\\nPublicação: ${dataPublicacao}\\nVencimento: ${dataVencimento}\\n\\nSempre confirme no sistema do tribunal.`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Prazo processual vence amanhã!", "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", "DESCRIPTION:Prazo processual vence em 3 dias!", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function PrazoCalc() {
  const [dataReferencia, setDataReferencia] = useState("");
  const [processoEletronico, setProcessoEletronico] = useState(true);
  const [tipoPrazo, setTipoPrazo] = useState("contestacao");
  const [diasPersonalizado, setDiasPersonalizado] = useState("");
  const [materia, setMateria] = useState("civel");
  const [contagem, setContagem] = useState("uteis");
  const [uf, setUf] = useState("SP");
  const [codigoIbge, setCodigoIbge] = useState<string>("");
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [tribunal, setTribunal] = useState<string>("");
  const [tribunais, setTribunais] = useState<Tribunal[]>([]);
  const [vara, setVara] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Resultado | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);

  const tipoData = processoEletronico ? "disponibilizacao" : "publicacao";

  const prazoSelecionado = PRAZOS_TIPO.find(p => p.id === tipoPrazo);
  const diasPrazo = tipoPrazo === "personalizado" ? (parseInt(diasPersonalizado) || 0) : (prazoSelecionado?.dias || 0);

  useEffect(() => {
    async function carregarTribunais() {
      // Junta os tribunais conhecidos com aqueles que já possuem suspensões
      // forenses cadastradas na tabela `feriados` (inclui a Justiça Federal).
      const [{ data: config }, { data: forenses }] = await Promise.all([
        supabase
          .from("tj_scraping_config")
          .select("tribunal, nome_completo")
          .order("priority", { ascending: false }),
        supabase.from("feriados").select("tribunal").eq("tipo", "forense"),
      ]);

      const nomes = new Map<string, string>();
      for (const t of config ?? []) nomes.set(t.tribunal, t.nome_completo);

      const comSuspensao = new Set(
        (forenses ?? []).map(f => f.tribunal).filter((t): t is string => !!t),
      );

      const lista: Tribunal[] = [];
      for (const codigo of comSuspensao) {
        lista.push({
          tribunal: codigo,
          nome_completo: `${nomes.get(codigo) ?? codigo} — suspensões cadastradas`,
        });
      }
      for (const [codigo, nome] of nomes) {
        if (!comSuspensao.has(codigo)) lista.push({ tribunal: codigo, nome_completo: nome });
      }
      setTribunais(lista);
    }
    carregarTribunais();
  }, []);


  useEffect(() => {
    async function carregarMunicipios() {
      if (!uf) {
        setMunicipios([]);
        setCodigoIbge("");
        return;
      }
      setCarregandoMunicipios(true);
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMunicipios(data.map((m: any) => ({ id: m.id, nome: m.nome })));
        }
      } catch {
        toast({ title: "Não foi possível carregar municípios", description: "Verifique a conexão ou tente outro estado.", variant: "destructive" });
        setMunicipios([]);
      } finally {
        setCarregandoMunicipios(false);
      }
    }
    carregarMunicipios();
  }, [uf]);

  const onTipoPrazoChange = (id: string) => {
    setTipoPrazo(id);
    const p = PRAZOS_TIPO.find(x => x.id === id);
    if (p && id !== "personalizado") {
      setMateria(p.materia);
      setContagem(p.materia === "penal" ? "corridos" : "uteis");
    }
  };

  const calcular = async () => {
    if (!dataReferencia || !diasPrazo) {
      toast({ title: "Informe a data e o prazo em dias", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("calcular-prazo", {
        body: {
          data_referencia: dataReferencia,
          tipo_data: tipoData,
          materia,
          dias: diasPrazo,
          contagem,
          uf,
          codigo_ibge: codigoIbge && codigoIbge !== "__todos__" ? codigoIbge : null,
          tribunal: tribunal && tribunal !== "__nenhum__" ? tribunal : null,
        },
      });

      if (error) {
        const info = await readFunctionError(error, "Falha ao calcular o prazo");
        toast({
          title: info.burstLimited ? "Muitas requisições" : info.limitReached ? "Limite mensal atingido" : "Erro no cálculo",
          description: info.message,
          variant: "destructive",
        });
        return;
      }
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setResult(data as Resultado);
      notifyUsageConsumed();

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao calcular o prazo";
      toast({ title: "Erro no cálculo", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const baixarICS = () => {
    if (!result) return;
    const prazoLabel = prazoSelecionado?.label || "Prazo personalizado";
    const ics = gerarICS(result.data_vencimento, result.data_publicacao, prazoLabel, uf);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prazo-${result.data_vencimento}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dr = result?.dias_restantes ?? 0;
  const corPrazo = result
    ? dr <= 3
      ? "text-destructive"
      : dr <= 7
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-green-600 dark:text-green-400"
    : "";
  const bgPrazo = result
    ? dr <= 3
      ? "border-destructive/30 bg-destructive/5"
      : dr <= 7
        ? "border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20"
        : "border-green-500/30 bg-green-50 dark:bg-green-950/20"
    : "";

  const tribunalLabel = useMemo(() => {
    if (!tribunal || tribunal === "__nenhum__") return "";
    const t = tribunais.find(x => x.tribunal === tribunal);
    return t ? `${t.tribunal} — ${t.nome_completo}` : tribunal;
  }, [tribunal, tribunais]);


  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Data de referência</Label>
          <Input className="h-11" type="date" value={dataReferencia} onChange={e => setDataReferencia(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Processo</Label>
          <Select value={processoEletronico ? "eletronico" : "fisico"} onValueChange={v => setProcessoEletronico(v === "eletronico")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="eletronico">Eletrônico (disponibilização no DJe)</SelectItem>
              <SelectItem value="fisico">Físico (publicação/intimação)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Prazo</Label>
          <Select value={tipoPrazo} onValueChange={onTipoPrazoChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRAZOS_TIPO.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}{p.dias > 0 ? ` (${p.dias} dias)` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {tipoPrazo === "personalizado" && (
          <div className="space-y-2">
            <Label>Prazo em dias</Label>
            <Input className="h-11" type="number" inputMode="numeric" min={1} placeholder="Ex: 10" value={diasPersonalizado} onChange={e => setDiasPersonalizado(e.target.value)} />
          </div>
        )}
        <div className="space-y-2">
          <Label>Matéria</Label>
          <Select value={materia} onValueChange={v => { setMateria(v); setContagem(v === "penal" ? "corridos" : "uteis"); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="civel">Cível (CPC, art. 219)</SelectItem>
              <SelectItem value="trabalhista">Trabalhista (CLT, art. 775)</SelectItem>
              <SelectItem value="penal">Penal (CPP, art. 798)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Contagem</Label>
          <Select value={contagem} onValueChange={setContagem}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uteis">Dias úteis</SelectItem>
              <SelectItem value="corridos">Dias corridos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={uf} onValueChange={setUf}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Município (feriados locais)</Label>
          <Select value={codigoIbge || "__todos__"} onValueChange={setCodigoIbge} disabled={carregandoMunicipios || municipios.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={carregandoMunicipios ? "Carregando..." : "Selecione o município"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__todos__">Todos os municípios do estado</SelectItem>
              {municipios.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tribunal (suspensões forenses)</Label>
          <Select value={tribunal || "__nenhum__"} onValueChange={setTribunal}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tribunal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__nenhum__">Nenhum tribunal específico</SelectItem>
              {tribunais.map(t => <SelectItem key={t.tribunal} value={t.tribunal}>{t.tribunal} — {t.nome_completo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Vara / Unidade judiciária</Label>
          <Select value={vara || "__nao__"} onValueChange={setVara}>
            <SelectTrigger><SelectValue placeholder="Selecione a vara" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__nao__">Não especificar</SelectItem>
              {VARAS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

      </div>

      <Button onClick={calcular} className="h-11 w-full sm:w-auto" disabled={loading || !dataReferencia || !diasPrazo}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Calcular Prazo
      </Button>

      {result && (
        <div className="space-y-4">
          <Card className={bgPrazo}>
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Data de vencimento do prazo:</p>
              <p className={cn("text-2xl font-bold capitalize", corPrazo)}>
                {format(parseISO(result.data_vencimento), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <div className={cn("text-sm font-medium", corPrazo)}>
                {result.dias_restantes < 0
                  ? `Prazo vencido há ${Math.abs(result.dias_restantes)} dia(s)`
                  : result.dias_restantes === 0
                    ? "O prazo vence HOJE"
                    : `Faltam ${result.dias_restantes} dia(s) corridos para o vencimento`}
              </div>
              <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3 pt-2">
                <span>Publicação: {format(parseISO(result.data_publicacao), "dd/MM/yyyy")}</span>
                <span>Início da contagem: {format(parseISO(result.data_inicio_contagem), "dd/MM/yyyy")}</span>
                <span>Contagem: {result.contagem === "uteis" ? "dias úteis" : "dias corridos"}</span>
              </div>
              {(codigoIbge && codigoIbge !== "__todos__") || (tribunal && tribunal !== "__nenhum__") ? (
                <div className="text-xs text-muted-foreground pt-1">
                  {codigoIbge && codigoIbge !== "__todos__" && `Município: ${municipios.find(m => String(m.id) === codigoIbge)?.nome || codigoIbge}`}
                  {codigoIbge && codigoIbge !== "__todos__" && tribunal && tribunal !== "__nenhum__" && " · "}
                  {tribunal && tribunal !== "__nenhum__" && `Tribunal: ${tribunalLabel}`}
                </div>
              ) : null}

              <Button variant="outline" size="sm" onClick={baixarICS} className="mt-2">
                <Download className="mr-1.5 h-4 w-4" /> Adicionar ao calendário (.ics)
              </Button>

              {RECURSOS_COM_PREPARO.includes(tipoPrazo) && (
                <p className="pt-2 text-xs text-muted-foreground">
                  Recurso sujeito a preparo: o comprovante deve acompanhar a petição.{" "}
                  <Link to="/calculadoras/custas-tjsp" className="text-primary underline underline-offset-2">
                    Calcular as custas do TJSP
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          {result.dias_excluidos.length > 0 && (
            <Collapsible open={detalhesAberto} onOpenChange={setDetalhesAberto}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="px-0">
                  <ChevronDown className={`mr-1.5 h-4 w-4 transition-transform ${detalhesAberto ? "rotate-180" : ""}`} />
                  Dias não computados ({result.dias_excluidos.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.dias_excluidos.map(d => (
                        <TableRow key={d.data}>
                          <TableCell className="font-medium">{format(parseISO(d.data), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{d.motivo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Card className="border-muted">
            <CardContent className="pt-6 space-y-1 text-xs text-muted-foreground">
              <p className="text-foreground font-medium">Base legal</p>
              {result.base_legal.map(b => <p key={b}>{b}</p>)}
              <p className="pt-2">
                Cálculo com feriados nacionais, estaduais, municipais (quando informado) e suspensões
                forenses do tribunal (quando informado). Sempre confirme no sistema do tribunal.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
