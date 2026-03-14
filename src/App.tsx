import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import History from "./pages/History";
import Petition from "./pages/Petition";
import Chat from "./pages/Chat";
import Calculators from "./pages/Calculators";
import LawyerDashboard from "./pages/LawyerDashboard";
import Diagnostico from "./pages/Diagnostico";
import Jurisprudencia from "./pages/Jurisprudencia";
import DecisaoDetalhe from "./pages/DecisaoDetalhe";
import LandingPage from "./pages/LandingPage";
import AdminIngestao from "./pages/AdminIngestao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  if (!user) return <LandingPage />;
  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UserProfileProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<HomeRoute />} />
              <Route path="/peticao" element={<ProtectedRoute><Petition /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/historico" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/calculadoras" element={<ProtectedRoute><Calculators /></ProtectedRoute>} />
              <Route path="/diagnostico" element={<ProtectedRoute><Diagnostico /></ProtectedRoute>} />
              <Route path="/jurisprudencia" element={<Jurisprudencia />} />
              <Route path="/decisao/:id" element={<DecisaoDetalhe />} />
              <Route path="/painel-advogado" element={<ProtectedRoute><LawyerDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </UserProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
