import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, History, LogOut, Plus, FileSignature, MessageCircle, Briefcase, User, Calculator } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export function AppHeader() {
  const { signOut } = useAuth();
  const { profile, setProfile, isLawyer } = useUserProfile();
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
          <span className="text-lg font-bold font-serif text-foreground">JurisAI</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Profile Toggle */}
          <button
            onClick={() => setProfile(isLawyer ? "cidadao" : "advogado")}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            title={isLawyer ? "Modo Advogado ativo" : "Modo Cidadão ativo"}
          >
            {isLawyer ? (
              <>
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary">Advogado</span>
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Cidadão</span>
              </>
            )}
          </button>

          <Button
            variant={location.pathname === "/" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Análise
          </Button>
          <Button
            variant={location.pathname === "/peticao" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/peticao")}
          >
            <FileSignature className="mr-1.5 h-4 w-4" />
            Petição
          </Button>
          <Button
            variant={location.pathname === "/chat" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/chat")}
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            Chat
          </Button>
          <Button
            variant={location.pathname === "/calculadoras" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/calculadoras")}
          >
            <Calculator className="mr-1.5 h-4 w-4" />
            Calculadoras
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
