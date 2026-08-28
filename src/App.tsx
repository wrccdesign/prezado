import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import History from "./pages/History";
import Petition from "./pages/Petition";
import Chat from "./pages/Chat";
import Calculators from "./pages/Calculators";
import CorrecaoMonetariaLanding from "./pages/calculators/CorrecaoMonetariaLanding";
import PrazoProcessualLanding from "./pages/calculators/PrazoProcessualLanding";
import CpfCnpjLanding from "./pages/calculators/CpfCnpjLanding";
import OperacoesDatasLanding from "./pages/calculators/OperacoesDatasLanding";
import CustasTjspLanding from "./pages/calculators/CustasTjspLanding";
import RescisaoTrabalhistaLanding from "./pages/calculators/RescisaoTrabalhistaLanding";
import PensaoAlimenticiaLanding from "./pages/calculators/PensaoAlimenticiaLanding";
import LawyerDashboard from "./pages/LawyerDashboard";
import Diagnostico from "./pages/Diagnostico";
import DiagnosticoLanding from "./pages/DiagnosticoLanding";

import Jurisprudencia from "./pages/Jurisprudencia";
import DecisaoDetalhe from "./pages/DecisaoDetalhe";
import LandingPage from "./pages/LandingPage";
import AdminIngestao from "./pages/AdminIngestao";
import Comparativo from "./pages/Comparativo";
import Planos from "./pages/Planos";
import ModelosMinutas from "./pages/ModelosMinutas";
import MinutaDetalhe from "./pages/MinutaDetalhe";
import Conta from "./pages/Conta";
import NotFound from "./pages/NotFound";
import Termos from "./pages/Termos";
import MapaDoSite from "./pages/MapaDoSite";
import Reembolso from "./pages/Reembolso";
import Privacidade from "./pages/Privacidade";
import ResetPassword from "./pages/ResetPassword";
import { PostAuthRedirect } from "@/components/PostAuthRedirect";
import { ProfileOnboardingDialog } from "@/components/ProfileOnboardingDialog";



const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  if (!user) return <Navigate to="/auth" replace state={{ redirectTo: `${location.pathname}${location.search}` }} />;
  return <>{children}</>;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  if (!user) return <LandingPage />;
  return <Index />;
}

function DiagnosticoRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  if (!user) return <DiagnosticoLanding />;
  return <Diagnostico />;
}


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UserProfileProvider>
            <PostAuthRedirect />
            <ProfileOnboardingDialog />
            <Routes>

              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<HomeRoute />} />
              <Route path="/peticao" element={<ProtectedRoute><Petition /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/historico" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/calculadoras" element={<Calculators />} />
              <Route path="/calculadoras/correcao-monetaria-juros-lei-14905" element={<CorrecaoMonetariaLanding />} />
              <Route path="/calculadoras/prazo-processual" element={<PrazoProcessualLanding />} />
              <Route path="/calculadoras/validador-cpf-cnpj" element={<CpfCnpjLanding />} />
              <Route path="/calculadoras/operacoes-datas" element={<OperacoesDatasLanding />} />
              <Route path="/calculadoras/custas-tjsp" element={<CustasTjspLanding />} />
              <Route path="/calculadoras/rescisao-trabalhista" element={<RescisaoTrabalhistaLanding />} />
              <Route path="/calculadoras/pensao-alimenticia" element={<PensaoAlimenticiaLanding />} />
              <Route path="/diagnostico" element={<DiagnosticoRoute />} />
              <Route path="/jurisprudencia" element={<Jurisprudencia />} />
              <Route path="/decisao/:id" element={<DecisaoDetalhe />} />
              <Route path="/painel-advogado" element={<ProtectedRoute><LawyerDashboard /></ProtectedRoute>} />
              <Route path="/modelos-de-minutas" element={<ModelosMinutas />} />
              <Route path="/modelos-de-minutas/:slug" element={<MinutaDetalhe />} />
              <Route path="/comparativo" element={<Comparativo />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/conta" element={<ProtectedRoute><Conta /></ProtectedRoute>} />
              <Route path="/admin/ingestao" element={<ProtectedRoute><AdminIngestao /></ProtectedRoute>} />
              <Route path="/mapa-do-site" element={<MapaDoSite />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/reembolso" element={<Reembolso />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </UserProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
