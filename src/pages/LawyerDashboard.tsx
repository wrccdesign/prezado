import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { AppHeader } from "@/components/AppHeader";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, FileText, BookTemplate, Settings } from "lucide-react";
import { DashboardTab } from "@/components/lawyer-dashboard/DashboardTab";
import { ClientsTab } from "@/components/lawyer-dashboard/ClientsTab";
import { PetitionsTab } from "@/components/lawyer-dashboard/PetitionsTab";
import { TemplatesTab } from "@/components/lawyer-dashboard/TemplatesTab";
import { SettingsTab } from "@/components/lawyer-dashboard/SettingsTab";
import { AppFooter } from "@/components/AppFooter";

export default function LawyerDashboard() {
  const { isLawyer, loading } = useUserProfile();
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
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">Painel do Advogado</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie clientes, petições, modelos e configurações</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Início</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="petitions" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" />
              Petições
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BookTemplate className="h-3.5 w-3.5" />
              Modelos
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Configurações</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="clients"><ClientsTab /></TabsContent>
          <TabsContent value="petitions"><PetitionsTab /></TabsContent>
          <TabsContent value="templates"><TemplatesTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
      <AppFooter />
    </div>
  );
}
