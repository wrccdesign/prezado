import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";

export interface Citation {
  id: string;
  tribunal: string | null;
  numero_processo?: string | null;
  ementa?: string | null;
  comarca?: string | null;
  data_decisao?: string | null;
}

interface CitationsProps {
  items: Citation[];
  noResultsMessage?: string;
}

export function Citations({ items, noResultsMessage }: CitationsProps) {
  if (!items || items.length === 0) {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-2">
        <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          {noResultsMessage ||
            "Resposta gerada sem lastro em jurisprudência indexada no nosso banco. Valide com um advogado antes de usar."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span className="font-medium">
          Fundamentado em {items.length} {items.length === 1 ? "decisão" : "decisões"} do nosso banco
        </span>
      </div>
      <div className="grid gap-2">
        {items.map((c) => (
          <Link
            key={c.id}
            to={`/decisao/${c.id}`}
            className="block rounded-md border bg-card px-3 py-2 text-xs hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {c.tribunal && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  {c.tribunal}
                </Badge>
              )}
              {c.numero_processo && (
                <span className="font-mono text-[10px] text-muted-foreground">{c.numero_processo}</span>
              )}
              {c.comarca && <span className="text-[10px] text-muted-foreground">· {c.comarca}</span>}
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
            </div>
            {c.ementa && (
              <p className="text-foreground/80 line-clamp-2 leading-snug">{c.ementa}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
