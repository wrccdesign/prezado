import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { consumePendingRedirect } from "@/lib/authRedirect";

/**
 * Após o login social (que sempre retorna para a origem), leva o usuário ao
 * destino que ele tentou acessar antes de entrar.
 */
export function PostAuthRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    const target = consumePendingRedirect();
    if (target) navigate(target, { replace: true });
  }, [user, loading, navigate]);

  return null;
}
