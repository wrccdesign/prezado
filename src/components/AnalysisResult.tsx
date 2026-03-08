import type { LegalAnalysis } from "@/types/analysis";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Scale, AlertTriangle, Clock, ExternalLink, Copy, ChevronRight,
  BookOpen, MapPin, ListOrdered, Globe, Gauge
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const complexityConfig = {
  simples: { label: "Simples", className: "bg-success text-success-foreground" },
  moderado: { label: "Moderado", className: "bg-warning text-warning-foreground" },
  complexo: { label: "Complexo", className: "bg-destructive text-destructive-foreground" },
};

export function AnalysisResult({ result, onNewAnalysis }: { result: LegalAnalysis; onNewAnalysis?: () => void }) {
  const { toast } = useToast();

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast({ title: "JSON copiado!" });
  };

  const complexity = complexityConfig[result.complexidade];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header badges */}
      <div className="flex flex-wrap gap-3">
        <Badge className="px-3 py-1.5 text-sm bg-primary text-primary-foreground">
          <Scale className="mr-1.5 h-3.5 w-3.5" />
          {result.tipo_de_causa}
        </Badge>
        <Badge className={`px-3 py-1.5 text-sm ${complexity.className}`}>
          <Gauge className="mr-1.5 h-3.5 w-3.5" />
          {complexity.label}
        </Badge>
        {result.urgencia && (
          <Badge className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Urgente
          </Badge>
        )}
        <Badge variant="outline" className="px-3 py-1.5 text-sm">
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          {result.prazo_estimado}
        </Badge>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Resumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-foreground">{result.resumo}</p>
        </CardContent>
      </Card>

      {/* Legislação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Legislação Aplicável
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.legislacao_aplicavel.map((leg, i) => (
              <li key={i} className="rounded-lg border bg-muted/50 p-3">
                <p className="font-semibold text-foreground">{leg.lei}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {leg.artigos.map((art, j) => (
                    <Badge key={j} variant="outline" className="text-xs">
                      {art}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Jurisdição */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Jurisdição Competente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{result.jurisdicao_competente}</p>
        </CardContent>
      </Card>

      {/* Direcionamentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="h-5 w-5 text-primary" />
            Direcionamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {result.direcionamentos.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Portais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Portais Relevantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.portais_relevantes.map((portal, i) => (
              <li key={i}>
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {portal.nome}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
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
