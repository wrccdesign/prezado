import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { logoStoragePath } from "@/lib/petitionBranding";
import { LogoUploadField } from "@/components/LogoUploadField";
import { useUserProfile } from "@/contexts/UserProfileContext";

/**
 * Timbre das petições para assinantes Escritório que não são advogados.
 * Sem OAB e sem especialidades: esses campos pertencem ao perfil advogado.
 */
export function LetterheadCard() {
  const { user } = useAuth();
  const { refreshProfile } = useUserProfile();
  const [displayName, setDisplayName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("office_name, office_address, office_phone, office_email, office_logo_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const row = data as Record<string, string | null>;
        setDisplayName(row.office_name ?? "");
        setAddress(row.office_address ?? "");
        setPhone(row.office_phone ?? "");
        setEmail(row.office_email ?? "");
        setLogoPath(logoStoragePath(row.office_logo_url));
      });
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      office_name: displayName.trim() || null,
      office_address: address.trim() || null,
      office_phone: phone.trim() || null,
      office_email: email.trim() || null,
      office_logo_url: logoPath,
      updated_at: new Date().toISOString(),
    } as never).eq("user_id", user.id);
    setSaving(false);
    if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
    toast({ title: "Timbre salvo" });
    await refreshProfile();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Timbre das petições</CardTitle>
        <CardDescription>
          Logo e identificação que aparecem no cabeçalho das petições exportadas em PDF e DOCX.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Nome ou identificação a exibir</Label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nome que aparece no cabeçalho"
          />
        </div>
        <div>
          <Label>Endereço</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, cidade - UF" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 0000-0000" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@exemplo.com" />
          </div>
        </div>

        {user && (
          <LogoUploadField
            userId={user.id}
            value={logoPath}
            onChange={setLogoPath}
            inputId="conta-logo-upload"
          />
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar timbre"}
        </Button>
      </CardContent>
    </Card>
  );
}
