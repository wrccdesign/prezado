import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { AppHeader } from "@/components/AppHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, History, Briefcase, MapPin, Award } from "lucide-react";

const SPECIALTY_LABELS: Record<string, string> = {
  civil: "Civil",
  trabalhista: "Trabalhista",
  criminal: "Criminal",
  familia: "Família",
  tributario: "Tributário",
  empresarial: "Empresarial",
  previdenciario: "Previdenciário",
  ambiental: "Ambiental",
};

export default function LawyerDashboard() {
  const { isLawyer, profileData, loading } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isLawyer) {
      navigate("/", { replace: true });
    }
  }, [isLawyer, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!isLawyer) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <LegalDisclaimer />

      <main className="flex-1 container py-6 sm:py-8 px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">Painel do Advogado</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie seus clientes, petições e modelos</p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Meu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {profileData?.oab_number && profileData?.oab_state && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">OAB {profileData.oab_number}/{profileData.oab_state}</span>
                </div>
              )}
              {profileData?.office_name && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="break-words">{profileData.office_name}</span>
                </div>
              )}
              {profileData?.specialties && profileData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profileData.specialties.map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {SPECIALTY_LABELS[spec] || spec}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Management Placeholder */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Gestão de Clientes
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Gerencie seus clientes e casos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Em breve você poderá cadastrar e gerenciar seus clientes aqui.
              </p>
              <Button variant="outline" disabled className="w-full">
                Em Desenvolvimento
              </Button>
            </CardContent>
          </Card>

          {/* Saved Templates Placeholder */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Modelos Salvos
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Seus modelos de petição favoritos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Salve e reutilize modelos de petições frequentes.
              </p>
              <Button variant="outline" disabled className="w-full">
                Em Desenvolvimento
              </Button>
            </CardContent>
          </Card>

          {/* Petition History */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Histórico de Petições
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Acesse todas as suas petições geradas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Visualize e baixe novamente petições criadas anteriormente.
              </p>
              <Button onClick={() => navigate("/historico")} className="w-full sm:w-auto">
                Ver Histórico Completo
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
