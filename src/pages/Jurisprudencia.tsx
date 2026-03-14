import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, MapPin, Calendar, Scale, ChevronDown, ChevronUp, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Decision {
  id: string;
  tribunal: string | null;
  instancia: string | null;
  uf: string | null;
  comarca: string | null;
  numero_processo: string | null;
  data_decisao: string | null;
  relator: string | null;
  tipo_decisao: string | null;
  resultado: string | null;
  resultado_descricao: string | null;
  temas_juridicos: string[];
  ramos_direito: string[];
  ementa: string | null;
  resumo_ia: string | null;
  comarca_pequena: boolean;
  upvotes: number;
  view_count: number;
  score_utilidade: number;
  source_url: string | null;
  created_at: string;
  rank: number;
}

interface SearchResponse {
  results: Decision[];
  ai_expansion: {
    query_expandida: string;
    keywords: string[];
    consultas_alternativas: string[];
    intencao_detectada: string;
  } | null;
  query_used: string;
  total: number;
}

const TRIBUNAIS = ["STF", "STJ", "TST", "TJSP", "TJMG", "TJRS", "TJPR", "TJSC", "TJRJ", "TRF1", "TRF3"];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const INSTANCIAS = [
  { value: "1grau", label: "1º Grau" },
  { value: "2grau", label: "2º Grau" },
  { value: "superior", label: "Superior" },
];

export default function Jurisprudencia() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Decision[]>([]);
  const [aiExpansion, setAiExpansion] = useState<SearchResponse["ai_expansion"]>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  // Filters
  const [tribunal, setTribunal] = useState<string>("");
  const [uf, setUf] = useState<string>("");
  const [instancia, setInstancia] = useState<string>("");
  const [comarcaPequena, setComarcaPequena] = useState(false);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-jurisprudencia", {
        body: {
          query: q,
          filters: {
            tribunal: tribunal || null,
            uf: uf || null,
            instancia: instancia || null,
            comarca_pequena: comarcaPequena || null,
          },
        },
      });

      if (error) throw error;

      const response = data as SearchResponse;
      setResults(response.results || []);
      setAiExpansion(response.ai_expansion);
    } catch (e: any) {
      console.error("Search error:", e);
      toast({
        title: "Erro na busca",
        description: e.message || "Não foi possível realizar a busca.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resultadoColor = (resultado: string | null) => {
    if (!resultado) return "bg-muted text-muted-foreground";
    if (resultado.includes("procedente") && !resultado.includes("improcedente")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (resultado === "improcedente") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (resultado === "provido") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        {/* Hero Search */}
        <div className="bg-primary text-primary-foreground py-8 sm:py-12">
          <div className="container px-4 max-w-3xl mx-auto">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-center mb-2">
              Busca de Jurisprudência
            </h1>
            <p className="text-center text-primary-foreground/70 text-sm sm:text-base mb-6">
              Descreva seu caso em linguagem natural — a IA encontra os precedentes
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Ex: plano de saúde negou cirurgia de urgência..."
                  className="pl-10 bg-white text-foreground border-0 h-11"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-6"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 mx-auto mt-3 text-xs text-primary-foreground/60 hover:text-primary-foreground/80 transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros avançados
              {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select value={tribunal} onValueChange={setTribunal}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-primary-foreground text-sm h-9">
                    <SelectValue placeholder="Tribunal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {TRIBUNAIS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-primary-foreground text-sm h-9">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={instancia} onValueChange={setInstancia}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-primary-foreground text-sm h-9">
                    <SelectValue placeholder="Instância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {INSTANCIAS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 bg-white/10 rounded-md px-3 h-9">
                  <Checkbox
                    id="comarca-pequena"
                    checked={comarcaPequena}
                    onCheckedChange={(v) => setComarcaPequena(!!v)}
                    className="border-white/40"
                  />
                  <label htmlFor="comarca-pequena" className="text-xs text-primary-foreground/80 cursor-pointer">
                    Interior
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="container px-4 max-w-3xl mx-auto py-6">
          {/* AI Expansion Info */}
          {aiExpansion && (
            <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 text-sm font-medium text-accent mb-1">
                <Sparkles className="h-4 w-4" />
                Busca expandida por IA
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {aiExpansion.intencao_detectada}
              </p>
              {aiExpansion.consultas_alternativas?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aiExpansion.consultas_alternativas.map((alt, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(alt); handleSearch(alt); }}
                      className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Results count */}
          {hasSearched && !loading && (
            <p className="text-sm text-muted-foreground mb-4">
              {results.length === 0 ? "Nenhuma decisão encontrada." : `${results.length} decisão(ões) encontrada(s)`}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Buscando jurisprudência com IA...</p>
            </div>
          )}

          {/* Decision Cards */}
          <div className="space-y-3">
            {results.map((d) => (
              <Card key={d.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {d.tribunal && (
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {d.tribunal}
                        </Badge>
                      )}
                      {d.resultado && (
                        <Badge className={`text-xs ${resultadoColor(d.resultado)}`}>
                          {d.resultado}
                        </Badge>
                      )}
                      {d.comarca_pequena && (
                        <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          <MapPin className="h-3 w-3 mr-0.5" />
                          Interior
                        </Badge>
                      )}
                      {d.instancia && (
                        <span className="text-xs text-muted-foreground">
                          {d.instancia === "1grau" ? "1º Grau" : d.instancia === "2grau" ? "2º Grau" : "Superior"}
                        </span>
                      )}
                    </div>
                    {d.data_decisao && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Calendar className="h-3 w-3" />
                        {new Date(d.data_decisao).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>

                  {d.numero_processo && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {d.numero_processo}
                    </p>
                  )}
                  {d.relator && (
                    <p className="text-xs text-muted-foreground">
                      Rel. {d.relator}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="px-4 pb-4">
                  {/* Ementa */}
                  {d.ementa && (
                    <p className={`text-sm leading-relaxed ${expandedId === d.id ? "" : "line-clamp-3"}`}>
                      {d.ementa}
                    </p>
                  )}

                  {/* AI Summary */}
                  {d.resumo_ia && expandedId === d.id && (
                    <div className="mt-3 p-2.5 rounded bg-accent/5 border border-accent/10">
                      <p className="text-xs font-medium text-accent mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Resumo IA
                      </p>
                      <p className="text-sm text-muted-foreground">{d.resumo_ia}</p>
                    </div>
                  )}

                  {/* Temas */}
                  {d.temas_juridicos?.length > 0 && expandedId === d.id && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {d.temas_juridicos.map((tema, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tema}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <button
                      onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                      className="text-xs text-accent hover:underline"
                    >
                      {expandedId === d.id ? "Ver menos" : "Ver mais"}
                    </button>

                    <div className="flex items-center gap-3">
                      {d.comarca && d.uf && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {d.comarca}/{d.uf}
                        </span>
                      )}
                      {d.source_url && (
                        <a
                          href={d.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Fonte
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {!hasSearched && (
            <div className="text-center py-16">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="font-serif text-lg font-semibold text-foreground mb-2">
                Pesquise jurisprudência brasileira
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Descreva a situação jurídica em linguagem natural. A IA expande sua busca com termos técnicos e encontra decisões relevantes.
              </p>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
