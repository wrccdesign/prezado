import { AlertTriangle } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";

export function LegalDisclaimer() {
  const { isLawyer, loading } = useUserProfile();

  // Don't show disclaimer for lawyers
  if (loading || isLawyer) {
    return null;
  }

  return (
    <div className="border-b border-gold/20 bg-gold/10 px-4 py-2">
      <div className="container flex items-center gap-2 text-sm text-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0 text-gold" />
        <p>
          <strong>Aviso:</strong> As informações fornecidas são orientativas e não substituem
          consulta jurídica profissional. Consulte um advogado para seu caso específico.
        </p>
      </div>
    </div>
  );
}
