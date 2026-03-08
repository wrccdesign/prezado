import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Scale, History, LogOut, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export function AppHeader() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-serif text-foreground">Assistente Jurídico</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant={location.pathname === "/" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Análise
          </Button>
          <Button
            variant={location.pathname === "/historico" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/historico")}
          >
            <History className="mr-1.5 h-4 w-4" />
            Histórico
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
