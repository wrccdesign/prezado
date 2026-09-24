import { useCallback, useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface TribunalRow { tribunal: string; total: number; indexadas: number; ultimos_7d: number; ultima_entrada: string | null }
interface RunRow { id: string; phase: number; total_ingested: number | null; results: Record<string, any> | null; executed_at: string | null }

// Espelha as listas de supabase/functions/cron-ingest/index.ts.
const TRIBUNAIS_POR_FASE: Record<number, number> = { 1: 19, 2: 8 };

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "sem registro");
const num = (n: number) => Number(n).toLocaleString("pt-BR");

export default function AdminColeta() {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [tribunais, setTribunais] = useState<TribunalRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const [t, r] = await Promise.all([
      (supabase.rpc as any)("admin_decisions_por_tribunal"),
      (supabase.rpc as any)("admin_ingest_runs", { p_limit: 10 }),
    ]);
    setTribunais((t.data as TribunalRow[]) ?? []);
    setRuns((r.data as RunRow[]) ?? []);
    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [isAdmin, load]);

  if (roleLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const total = tribunais.reduce((s, t) => s + Number(t.total), 0);
  const atual = runs[0];
  const feitos = atual ? Object.keys(atual.results ?? {}).filter((k) => !k.startsWith("_")) : [];
  const esperado = atual ? TRIBUNAIS_POR_FASE[atual.phase] ?? feitos.length : 0;
  const pct = esperado ? Math.min(100, Math.round((feitos.length / esperado) * 100)) : 0;
  const emAndamento = atual && feitos.length < esperado && atual.executed_at && Date.now() - new Date(atual.executed_at).getTime() < 6 * 3600_000;

  return (
    <div className="min-h-screen bg-cream text-navy">
      <AppHeader />
      <main className="container max-w-[1120px] px-4 py-12 sm:px-6 space-y-12">
        <div className="space-y-2">
          <h1 className="text-h1">Coleta de decisões</h1>
          <p className="text-navy/70">
            {num(total)} decisões no acervo. Atualiza sozinho a cada 15 segundos
            {updatedAt ? `, última leitura às ${updatedAt.toLocaleTimeString("pt-BR")}` : ""}.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={load}>Atualizar agora</Button>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/ingestao">Voltar à ingestão</Link></Button>
          </div>
        </div>

        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-navy/50" />
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-h2">Coleta mais recente</h2>
              {!atual ? (
                <p className="text-navy/70">Nenhuma execução registrada.</p>
              ) : (
                <div className="rounded-lg border border-cream-dark bg-white p-5 space-y-4">
                  <p>
                    Fase {atual.phase}, iniciada em {fmt(atual.executed_at)}.{" "}
                    {emAndamento ? "Em andamento." : feitos.length >= esperado ? "Concluída." : "Parou antes do fim."}
                  </p>
                  <Progress value={pct} />
                  <p className="text-sm text-navy/70 tabular-nums">
                    {feitos.length} de {esperado} tribunais, {num(atual.total_ingested ?? 0)} decisões novas
                    {atual.results?._query ? `, busca "${atual.results._query}"` : ""}.
                  </p>
                  {feitos.length > 0 && (
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-cream-dark text-left">
                        <th className="py-2 font-medium">Tribunal</th><th className="py-2 font-medium text-right">Novas</th>
                        <th className="py-2 font-medium text-right">Ignoradas</th><th className="py-2 font-medium text-right">Erros</th>
                      </tr></thead>
                      <tbody className="tabular-nums">
                        {feitos.map((k) => {
                          const r = atual.results![k] ?? {};
                          const erros = Array.isArray(r.errors) ? r.errors.length : Number(r.errors ?? 0);
                          return (
                            <tr key={k} className="border-b border-cream-dark last:border-0">
                              <td className="py-2">{k}</td><td className="py-2 text-right">{r.ingested ?? 0}</td>
                              <td className="py-2 text-right">{r.skipped ?? 0}</td>
                              <td className={`py-2 text-right ${erros ? "text-destructive" : ""}`}>{erros}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
              {runs.length > 1 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-navy/70">Execuções anteriores</summary>
                  <ul className="mt-3 space-y-1 tabular-nums">
                    {runs.slice(1).map((r) => (
                      <li key={r.id}>
                        {fmt(r.executed_at)}, fase {r.phase}: {Object.keys(r.results ?? {}).filter((k) => !k.startsWith("_")).length} tribunais, {num(r.total_ingested ?? 0)} novas
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-h2">Decisões por tribunal</h2>
              <div className="overflow-x-auto rounded-lg border border-cream-dark bg-white">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-cream-dark text-left">
                    <th className="p-3 font-medium">Tribunal</th><th className="p-3 font-medium text-right">Total</th>
                    <th className="p-3 font-medium text-right">Prontas para busca</th><th className="p-3 font-medium text-right">Últimos 7 dias</th>
                    <th className="p-3 font-medium">Última entrada</th>
                  </tr></thead>
                  <tbody className="tabular-nums">
                    {tribunais.map((t) => (
                      <tr key={t.tribunal} className="border-b border-cream-dark last:border-0">
                        <td className="p-3">{t.tribunal}</td><td className="p-3 text-right">{num(t.total)}</td>
                        <td className="p-3 text-right">{num(t.indexadas)}</td><td className="p-3 text-right">{num(t.ultimos_7d)}</td>
                        <td className="p-3">{fmt(t.ultima_entrada)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
