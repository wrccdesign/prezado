import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import Logo from "@/components/Logo";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    setHasRecoverySession(hashParams.get("type") === "recovery");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecoverySession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Senhas diferentes", description: "Digite a mesma senha nos dois campos.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Senha atualizada", description: "Sua nova senha já pode ser usada." });
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível atualizar a senha.";
      toast({ title: "Erro ao atualizar senha", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 py-8">
      <SEO title="Redefinir senha — Honorífico" description="Crie uma nova senha para acessar sua conta Honorífico." path="/reset-password" />
      <div className="w-full max-w-md">
        <Logo className="mx-auto mb-6 h-12" />
        <Card>
          <CardHeader>
            <CardTitle>Redefinir senha</CardTitle>
            <CardDescription>Crie uma senha segura com pelo menos 6 caracteres.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasRecoverySession ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} required autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Atualizando..." : "Salvar nova senha"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>Este link é inválido ou expirou. Solicite um novo link na tela de acesso.</p>
                <Button asChild variant="outline" className="w-full"><Link to="/auth">Voltar para entrar</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}