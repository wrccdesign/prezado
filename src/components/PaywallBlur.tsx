import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallBlurProps {
  locked: boolean;
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function PaywallBlur({
  locked,
  children,
  title = "Continue lendo com Profissional",
  subtitle = "Desbloqueie o diagnóstico completo, petições e chat ilimitado.",
}: PaywallBlurProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none [filter:blur(6px)]"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/40 backdrop-blur-[1px]">
        <div className="mx-4 max-w-xs rounded-xl border bg-card p-4 text-center shadow-lg">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
          <Button asChild size="sm" className="mt-3 w-full">
            <Link to="/planos">Ver planos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
