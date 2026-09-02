import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { AppFooter } from "@/components/AppFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check } from "lucide-react";
import { formatCitation } from "@/lib/citation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notifyUsageConsumed } from "@/hooks/useUsage";

interface Decision {
  id: string;
  tribunal: string | null;
  instancia: string | null;
  uf: string | null;
  comarca: string | null;
  numero_processo: string | null;
  data_decisao: string | null;
  relator: string | null;
  orgao_julgador: string | null;
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
  guest_preview?: boolean;

}

const TRIBUNAIS = [
  "STJ",
  "TST",
  "TRF1",
  "TRF3",
  "TJAC",
  "TJAL",
  "TJAM",
  "TJAP",
  "TJBA",
  "TJCE",
  "TJDF",
  "TJES",
  "TJGO",
  "TJMA",
  "TJMG",
  "TJMS",
  "TJMT",
  "TJPA",
  "TJPB",
  "TJPE",
  "TJPI",
  "TJPR",
  "TJRJ",
  "TJRN",
  "TJRO",
  "TJRR",
  "TJRS",
  "TJSC",
  "TJSE",
  "TJSP",
  "TJTO",
];
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const INSTANCIAS = [
  { value: "1grau", label: "1º Grau" },
  { value: "2grau", label: "2º Grau" },
  { value: "superior", label: "Superior" },
];

export default function Jurisprudencia() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Decision[]>([]);
  const [aiExpansion, setAiExpansion] = useState<SearchResponse["ai_expansion"]>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [guestPreview, setGuestPreview] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyCitation = (e: React.MouseEvent, d: Decision) => {
    e.preventDefault();
    e.stopPropagation();
    const citation = formatCitation(d);
    navigator.clipboard.writeText(citation);
    setCopiedId(d.id);
    toast({ title: "Citação copiada!", description: "Formatada no padrão processual brasileiro." });
    setTimeout(() => setCopiedId(null), 2000);
  };

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
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-jurisprudencia`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ""}`,
    "x-payment-env": import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN?.startsWith("test_") ? "sandbox" : "live",
  },
  body: JSON.stringify({
    query: q,
    filters: {
      tribunal: tribunal || null,
      uf: uf || null,
      instancia: instancia || null,
      comarca_pequena: comarcaPequena || null,
    },
  }),
});

if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 429 && errData?.limit_reached) {
          toast({
            title: "Limite mensal atingido",
            description: errData.error || "Você atingiu o limite de buscas do plano gratuito.",
            variant: "destructive",
            action: (
              <Button variant="outline" size="sm" onClick={() => navigate("/planos")}>
                Ver planos
              </Button>
            ),
          });
          setLoading(false);
          return;
        }
        if (res.status === 401) {
          toast({
            title: "Crie sua conta grátis para continuar",
            description:
              errData?.error ||
              "As buscas de demonstração acabaram. A conta gratuita já vem com 7 dias do plano Profissional.",
            action: (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                Criar conta
              </Button>
            ),
          });
          setLoading(false);
          return;
        }
        throw new Error(errData?.error || `Erro ${res.status}`);
      }

      const response = await res.json() as SearchResponse;
      notifyUsageConsumed();
      setGuestPreview(!!response.guest_preview);
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

  const hasSearchedRef = useRef(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !hasSearchedRef.current) {
      hasSearchedRef.current = true;
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams, handleSearch]);



  return (
    <div className="min-h-screen flex flex-col bg-cream text-navy font-sans">
      <AppHeader />
      <SEO
        title="Consulta processual e jurisprudência — Honorífico"
        description="Consulte processos nos dados oficiais do CNJ, com link para a fonte no tribunal. Acervo de jurisprudência com ementa em expansão e resumo por IA."
        path="/jurisprudencia"
        image="/og/jurisprudencia.jpg"
        imageAlt="Consulta processual com dados oficiais do CNJ — Honorífico"

        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Honorífico",
            url: "https://honorifico.com.br/",
            inLanguage: "pt-BR",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://honorifico.com.br/jurisprudencia?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: "https://honorifico.com.br/" },
              {
                "@type": "ListItem",
                position: 2,
                name: "Jurisprudência",
                item: "https://honorifico.com.br/jurisprudencia",
              },
            ],
          },
        ]}
      />
      <main className="flex-1">
        {/* Busca */}
        <div className="bg-cream text-navy py-12 md:py-16">
          <div className="container px-4 max-w-3xl mx-auto">
            <h1 className="text-h1 max-w-[18ch]">Consulta processual e jurisprudência</h1>
            <p className="text-body-serif text-navy/80 max-w-[60ch] mt-5">
              Descreva a situação ou cole o número CNJ. A busca cobre o acervo indexado; com conta, também a consulta ao vivo no DataJud.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Descreva a situação ou cole o número CNJ"
                className="h-12 flex-1 bg-white text-navy border border-cream-dark rounded-md placeholder:text-navy/50 font-sans focus-visible:ring-gold"
              />
              <Button
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
                className="h-12 px-8 bg-gold text-navy hover:bg-gold-light"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mt-4 text-note text-navy/70 underline underline-offset-4 hover:text-navy"
            >
              {showFilters ? "Ocultar filtros avançados" : "Filtros avançados"}
            </button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select value={tribunal} onValueChange={setTribunal}>
                  <SelectTrigger className="bg-white border-cream-dark text-navy text-sm h-10">
                    <SelectValue placeholder="Tribunal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {TRIBUNAIS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger className="bg-white border-cream-dark text-navy text-sm h-10">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={instancia} onValueChange={setInstancia}>
                  <SelectTrigger className="bg-white border-cream-dark text-navy text-sm h-10">
                    <SelectValue placeholder="Instância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {INSTANCIAS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 bg-white border border-cream-dark rounded-md px-3 h-10">
                  <Checkbox
                    id="comarca-pequena"
                    checked={comarcaPequena}
                    onCheckedChange={(v) => setComarcaPequena(!!v)}
                    className="border-navy/30"
                  />
                  <label htmlFor="comarca-pequena" className="text-note text-navy/80 cursor-pointer">
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
            <section className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20" aria-labelledby="secao-ia">
              <h2 id="secao-ia" className="flex items-center gap-2 text-sm font-medium text-accent mb-1">
                <Sparkles className="h-4 w-4" />
                Busca expandida por IA
              </h2>

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
            </section>
          )}

          {/* Results count */}
          {hasSearched && !loading && (
            <>
              <h2 className="sr-only">Resultados da busca</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {results.length === 0 ? "Nenhuma decisão encontrada." : `${results.length} decisão(ões) encontrada(s)`}
              </p>
            </>
          )}


          {guestPreview && !loading && (
            <Card className="mb-4 border-accent/30 bg-accent/5">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Você está vendo uma prévia limitada</p>
                  <p className="text-sm text-muted-foreground">
                    Crie sua conta grátis para ver todos os resultados, usar a expansão de busca com IA e filtros avançados.
                  </p>
                </div>
                <Button className="shrink-0" onClick={() => navigate("/auth")}>
                  Criar conta grátis
                </Button>
              </CardContent>
            </Card>
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
              <Link key={d.id} to={`/decisao/${d.id}`} className="block">
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {d.tribunal && (
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {d.tribunal}
                        </Badge>
                      )}
                      {!d.ementa && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Andamento processual
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
                </CardHeader>

                <CardContent className="px-4 pb-4">

                  {/* Ementa — hero element */}
{(d.ementa || d.resumo_ia) ? (
  <p className={`text-sm font-medium leading-relaxed text-foreground ${expandedId === d.id ? "" : "line-clamp-3"}`}>
    {d.ementa || d.resumo_ia}
  </p>
) : (
  <p className="text-sm italic text-muted-foreground">Sem teor decisório disponível — apenas dados de tramitação.</p>
)}


                  {/* Processo number */}
                  {d.numero_processo && !d.numero_processo.includes('<UNKNOWN>') && (
                    <p className="text-xs text-muted-foreground font-mono mt-2">
                      Proc. {d.numero_processo}
                    </p>
                  )}

                  {/* Relator + Órgão Julgador + Comarca */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                    {d.relator && (
                      <span className="text-xs text-muted-foreground">
                        Rel. {d.relator}
                      </span>
                    )}
                    {d.orgao_julgador && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Gavel className="h-3 w-3" />
                        {d.orgao_julgador}
                      </span>
                    )}
                    {d.comarca && d.uf && (
                      <span className={`text-xs flex items-center gap-1 ${d.comarca_pequena ? "text-purple-700 dark:text-purple-300 font-medium" : "text-muted-foreground"}`}>
                        <MapPin className="h-3 w-3" />
                        {d.comarca}/{d.uf}
                      </span>
                    )}
                  </div>

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
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpandedId(expandedId === d.id ? null : d.id); }}
                      className="text-xs text-accent hover:underline"
                    >
                      {expandedId === d.id ? "Ver menos" : "Ver mais"}
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleCopyCitation(e, d)}
                        className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
                        title="Copiar citação formatada"
                      >
                        {copiedId === d.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedId === d.id ? "Copiado" : "Citar"}
                      </button>
                     {d.numero_processo && !d.numero_processo.includes('<UNKNOWN>') && (
                       <button
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           navigator.clipboard.writeText(d.numero_processo!);
                           toast({ title: "Nº CNJ copiado", description: "Cole na consulta processual do tribunal de origem." });
                         }}
                         className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
                         title="Copiar número CNJ do processo"
                       >
                         <Copy className="h-3 w-3" />
                         Copiar nº CNJ
                       </button>
                     )}

                     {d.source_url && (
                       <a
                         href={d.source_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         onClick={(e) => e.stopPropagation()}
                         className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
                         title="Abrir a decisão na fonte oficial"
                       >
                         <ExternalLink className="h-3 w-3" />
                         Ver no tribunal
                       </a>
                     )}
                    </div>

                  </div>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {!hasSearched && (
            <div className="text-center py-16">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="font-serif text-lg font-semibold text-foreground mb-2">
                Consulte processos e decisões
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Descreva a situação jurídica em linguagem natural. A IA expande sua busca com termos técnicos e localiza processos nos dados oficiais do CNJ, além das decisões com ementa já indexadas.
              </p>

            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
