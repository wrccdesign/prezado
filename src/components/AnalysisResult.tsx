import type { LegalAnalysis } from "@/types/analysis";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Scale, AlertTriangle, Clock, ExternalLink, Copy, ChevronRight,
  BookOpen, MapPin, ListOrdered, Globe, Gauge, FileText, Users,
  AlertCircle, Lightbulb, Gavel, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const complexityConfig = {
  simples: { label: "Simples", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  moderado: { label: "Moderado", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: AlertCircle },
  complexo: { label: "Complexo", className: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: AlertTriangle },
};

function SectionCard({ 
  icon: Icon, 
  title, 
  description,
  variant = "default",
  children 
}: { 
  icon: React.ElementType; 
  title: string; 
  description?: string;
  variant?: "default" | "highlight" | "warning";
  children: React.ReactNode;
}) {
  const variantClasses = {
    default: "border-border",
    highlight: "border-primary/30 bg-primary/5",
    warning: "border-amber-500/30 bg-amber-500/5",
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${variantClasses[variant]}`}>
      <CardHeader className="pb-3 space-y-1">
        <CardTitle className="flex items-center gap-2.5 text-base font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AnalysisResult({ result, onNewAnalysis }: { result: LegalAnalysis; onNewAnalysis?: () => void }) {
  const { toast } = useToast();

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast({ title: "JSON copiado!" });
  };

  const complexity = complexityConfig[result.complexidade];
  const ComplexityIcon = complexity.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section - Tipo e Status */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Gavel className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo de Causa</p>
                <h2 className="text-xl font-bold text-foreground">{result.tipo_de_causa}</h2>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={`px-3 py-1.5 text-sm border ${complexity.className}`}>
              <ComplexityIcon className="mr-1.5 h-3.5 w-3.5" />
              {complexity.label}
            </Badge>
            {result.urgencia && (
              <Badge className="px-3 py-1.5 text-sm bg-rose-500/10 text-rose-600 border border-rose-500/20">
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                Urgente
              </Badge>
            )}
            <Badge variant="outline" className="px-3 py-1.5 text-sm">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              {result.prazo_estimado}
            </Badge>
          </div>
        </div>
      </div>

      {/* Grid de Cards Principais */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Resumo - Full width */}
        <div className="md:col-span-2">
          <SectionCard icon={BookOpen} title="Resumo da Análise" variant="highlight">
            <p className="leading-relaxed text-foreground text-sm">{result.resumo}</p>
          </SectionCard>
        </div>

        {/* Legislação Aplicável */}
        <SectionCard 
          icon={Scale} 
          title="Legislação Aplicável" 
          description="Dispositivos legais identificados"
        >
          <div className="space-y-3">
            {result.legislacao_aplicavel.map((leg, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 p-3">
                <p className="font-medium text-sm text-foreground">{leg.lei}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {leg.artigos.map((art, j) => (
                    <Badge key={j} variant="secondary" className="text-xs font-mono">
                      {art}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Jurisdição */}
        <SectionCard 
          icon={MapPin} 
          title="Jurisdição Competente"
          description="Foro para processamento"
        >
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">{result.jurisdicao_competente}</p>
          </div>
        </SectionCard>
      </div>

      {/* Direcionamentos - Passos */}
      <SectionCard 
        icon={ListOrdered} 
        title="Direcionamentos Recomendados"
        description="Próximos passos sugeridos para o caso"
      >
        <div className="space-y-3">
          {result.direcionamentos.map((step, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="text-sm text-foreground pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Portais Relevantes */}
      <SectionCard 
        icon={Globe} 
        title="Portais e Recursos"
        description="Links úteis para consulta"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {result.portais_relevantes.map((portal, i) => (
            <a
              key={i}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition-all hover:bg-primary/5 hover:border-primary/30 group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <ExternalLink className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {portal.nome}
              </span>
            </a>
          ))}
        </div>
      </SectionCard>

      {/* Aviso Legal */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Aviso:</strong> Esta análise é informativa e foi gerada por inteligência artificial. 
            Consulte um advogado para orientação específica sobre seu caso.
          </p>
        </div>
      </div>

      {/* Actions */}
      <Separator />
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={copyJson}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar JSON
        </Button>
        {onNewAnalysis && (
          <Button onClick={onNewAnalysis}>
            <ChevronRight className="mr-2 h-4 w-4" />
            Nova Análise
          </Button>
        )}
      </div>
    </div>
  );
}
