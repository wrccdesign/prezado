import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { savePeticaoPrefill, type PeticaoPrefill } from "@/lib/peticaoPrefill";

interface UsarNaPeticaoButtonProps {
  /** Dados do cálculo que serão levados ao gerador de petições. */
  payload: PeticaoPrefill;
  /** Texto do botão, varia conforme a calculadora. */
  label: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
}

/**
 * Leva o resultado da calculadora para o gerador de petições.
 * Visitante sem conta passa por /auth e cai na petição já preenchida.
 */
export function UsarNaPeticaoButton({
  payload,
  label,
  variant = "outline",
  size = "sm",
}: UsarNaPeticaoButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const ir = () => {
    savePeticaoPrefill(payload);
    if (user) {
      navigate("/peticao");
      return;
    }
    toast({
      title: "Cálculo guardado",
      description:
        "Crie sua conta grátis para gerar a petição com estes números. Leva menos de um minuto.",
    });
    navigate("/auth", { state: { redirectTo: "/peticao" } });
  };

  return (
    <Button variant={variant} size={size} onClick={ir}>
      {label}
    </Button>
  );
}
