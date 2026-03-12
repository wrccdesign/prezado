import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const SPECIALTIES = [
  { id: "civil", label: "Civil" },
  { id: "trabalhista", label: "Trabalhista" },
  { id: "criminal", label: "Criminal" },
  { id: "familia", label: "Família" },
  { id: "tributario", label: "Tributário" },
  { id: "empresarial", label: "Empresarial" },
  { id: "previdenciario", label: "Previdenciário" },
  { id: "ambiental", label: "Ambiental" },
];

export default function Auth() {
  const { user, loading } = useAuth();
  const { updateProfile } = useUserProfile();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Lawyer fields
  const [isLawyer, setIsLawyer] = useState(false);
  const [oabNumber, setOabNumber] = useState("");
  const [oabState, setOabState] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [officeName, setOfficeName] = useState("");
  
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const toggleSpecialty = (specId: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(specId)
        ? prev.filter(s => s !== specId)
        : [...prev, specId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (isSignUp) {
      const { error } = await signUp(email, password);
      
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        // Store lawyer data to be saved after email confirmation
        if (isLawyer && oabNumber && oabState) {
          localStorage.setItem("jurisai-pending-lawyer-profile", JSON.stringify({
            profile_type: "advogado",
            oab_number: oabNumber,
            oab_state: oabState,
            specialties: selectedSpecialties,
            office_name: officeName || null,
          }));
        }
        toast({ 
          title: "Cadastro realizado!", 
          description: "Verifique seu e-mail para confirmar a conta." 
        });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <img src={logo} alt="JurisAI" className="h-12 mx-auto mb-4" />
          <p className="mt-2 text-muted-foreground">Assistente jurídico inteligente para o Direito brasileiro</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{isSignUp ? "Criar conta" : "Entrar"}</CardTitle>
            <CardDescription>
              {isSignUp
                ? "Crie sua conta para salvar suas análises"
                : "Acesse sua conta para continuar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Lawyer fields - only show in signup mode */}
              {isSignUp && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-lawyer" className="text-sm font-medium">
                      Você é advogado?
                    </Label>
                    <Switch
                      id="is-lawyer"
                      checked={isLawyer}
                      onCheckedChange={setIsLawyer}
                    />
                  </div>

                  {isLawyer && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="oab-number">Número OAB</Label>
                          <Input
                            id="oab-number"
                            type="text"
                            placeholder="123456"
                            value={oabNumber}
                            onChange={(e) => setOabNumber(e.target.value)}
                            required={isLawyer}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oab-state">Estado</Label>
                          <Select value={oabState} onValueChange={setOabState} required={isLawyer}>
                            <SelectTrigger id="oab-state">
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent>
                              {UF_LIST.map(uf => (
                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Especialidades</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {SPECIALTIES.map(spec => (
                            <div key={spec.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`spec-${spec.id}`}
                                checked={selectedSpecialties.includes(spec.id)}
                                onCheckedChange={() => toggleSpecialty(spec.id)}
                              />
                              <label
                                htmlFor={`spec-${spec.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {spec.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="office-name">Nome do Escritório (opcional)</Label>
                        <Input
                          id="office-name"
                          type="text"
                          placeholder="Ex: Advocacia Silva & Associados"
                          value={officeName}
                          onChange={(e) => setOfficeName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsLawyer(false);
                }}
                className="text-primary hover:underline"
              >
                {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
