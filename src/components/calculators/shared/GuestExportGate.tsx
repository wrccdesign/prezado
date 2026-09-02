import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Gancho de conversão das calculadoras: o cálculo e a memória são livres, sem
 * conta. Levar o arquivo (exportar) ou guardar no histórico exige conta grátis.
 */
export function useGuestExportGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireAccount = useCallback(
    (run: () => void, motivo = "baixar a memória de cálculo") => {
      if (user) {
        run();
        return;
      }
      toast({
        title: "Crie sua conta grátis",
        description: `O cálculo é livre. Para ${motivo} basta criar uma conta gratuita, leva menos de um minuto.`,
        action: (
          <ToastAction
            altText="Criar conta"
            onClick={() =>
              navigate("/auth", { state: { redirectTo: location.pathname + location.search } })
            }
          >
            Criar conta
          </ToastAction>
        ),
      });
    },
    [user, navigate, location],
  );

  return { isAuthenticated: !!user, requireAccount };
}
