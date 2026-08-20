import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ResultCardProps {
  /** Rótulo curto acima do valor. */
  label: string;
  /** Valor dominante, já formatado. */
  value: string;
  /** Linha de contexto abaixo do valor. */
  meta?: ReactNode;
  /** Observações relevantes (piso/teto, isenção, etc.). */
  notes?: ReactNode;
  /** Botões de ação — empilham no mobile. */
  actions?: ReactNode;
}

/**
 * Card de resultado padrão das calculadoras: valor dominante primeiro,
 * contexto em seguida, ações por último.
 */
export function ResultCard({ label, value, meta, notes, actions }: ResultCardProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-primary sm:text-4xl">{value}</p>
          {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
          {notes}
        </div>
        {actions && <div className="grid gap-2 sm:flex sm:flex-wrap">{actions}</div>}
      </CardContent>
    </Card>
  );
}
