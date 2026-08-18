import { Link } from "react-router-dom";
import { Gauge, Lock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUsage, type UsageAction } from "@/hooks/useUsage";

function remaining(a: UsageAction) {
  return Math.max(a.limit - a.used, 0);
}

function barColor(a: UsageAction) {
  const ratio = a.limit > 0 ? a.used / a.limit : 1;
  if (ratio >= 1) return "bg-destructive";
  if (ratio >= 0.8) return "bg-gold";
  return "bg-primary";
}

function formatRenewal(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Versão compacta usada no menu do avatar. */
export function UsageSummaryCompact({ onNavigate }: { onNavigate?: () => void }) {
  const { data, isLoading } = useUsage();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-2 text-xs text-white/50">
        <Loader2 className="h-3 w-3 animate-spin" /> Carregando uso...
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="px-2 py-2">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        Uso neste mês
      </p>

      <ul className="space-y-1.5">
        {data.actions.map((a) => (
          <li key={a.action} className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-white/60">{a.label}</span>
            {a.limit === 0 ? (
              <span className="flex shrink-0 items-center gap-1 text-white/40">
                <Lock className="h-3 w-3" /> Indisponível
              </span>
            ) : (
              <span className="shrink-0 font-medium text-white/80">
                {remaining(a)}/{a.limit}
              </span>
            )}
          </li>
        ))}
      </ul>
      <Link
        to="/conta"
        onClick={onNavigate}
        className="mt-2 inline-block text-xs font-medium text-gold-light hover:underline"
      >
        Ver detalhes
      </Link>
    </div>
  );
}

/** Versão completa usada na página Minha conta. */
export function UsageSummary() {
  const { data, isLoading } = useUsage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-lg">
          <Gauge className="h-4 w-4" /> Seu uso hoje
        </CardTitle>
        <CardDescription>
          Os limites são diários e renovam automaticamente
          {data?.resets_at ? ` às ${formatReset(data.resets_at)}.` : "."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando uso...
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar seu uso.</p>
        ) : (
          <div className="space-y-4">
            {data.actions.map((a) => {
              const pct = a.limit > 0 ? Math.min((a.used / a.limit) * 100, 100) : 100;
              return (
                <div key={a.action}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{a.label}</span>
                    {a.limit === 0 ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" /> Não incluído no seu plano
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {a.used} de {a.limit} · restam {remaining(a)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${a.limit === 0 ? "bg-muted-foreground/30" : barColor(a)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {data.plan !== "escritorio" && (
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link to="/planos">Aumentar meus limites</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
