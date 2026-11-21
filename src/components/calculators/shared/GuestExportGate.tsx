import { useCallback, useEffect } from "react";
import { track, setSignupOrigem } from "@/lib/track";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Gancho de conversão das calculadoras: o cálculo e a memória são livres, sem
 * conta. Levar o arquivo (exportar) ou guardar no histórico exige conta grátis.
 */
const PENDING_KEY = "hon_export_gate_pending";

export function useGuestExportGate(calculadora?: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Voltou do cadastro pela redirectTo: avisa, sem baixar nada sozinho.
  useEffect(() => {
    if (!user) return;
    try {
      if (localStorage.getItem(PENDING_KEY) !== location.pathname) return;
      localStorage.removeItem(PENDING_KEY);
    } catch { return; }
    toast({ title: "Conta criada. Clique em Exportar PDF para baixar a memória." });
  }, [user, location.pathname]);

  const requireAccount = useCallback(
    (run: () => void, motivo = "baixar a memória de cálculo") => {
      if (user) {
        run();
        return;
      }
      track("export_gate_shown", { calculadora, motivo });
      toast({
        title: "Crie sua conta grátis",
        description: `O cálculo é livre. Para ${motivo}, basta criar uma conta gratuita. Leva menos de um minuto.`,
        action: (
          <ToastAction
            altText="Criar conta"
            onClick={() => {
              setSignupOrigem("export_gate", calculadora);
              try { localStorage.setItem(PENDING_KEY, location.pathname); } catch { /* ignore */ }
              navigate("/auth", { state: { redirectTo: location.pathname + location.search } });
            }}
          >
            Criar conta
          </ToastAction>
        ),
      });
    },
    [user, navigate, location, calculadora],
  );

  return { isAuthenticated: !!user, requireAccount };
}
