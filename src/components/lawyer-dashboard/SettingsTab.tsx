import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PlanGate } from "@/components/PlanGate";
import { logoStoragePath } from "@/lib/petitionBranding";
import { LogoUploadField } from "@/components/LogoUploadField";


export function SettingsTab() {
  const { user } = useAuth();
  const { profileData, refreshProfile } = useUserProfile();

  const [fullName, setFullName] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officeEmail, setOfficeEmail] = useState("");
  const [oabNumber, setOabNumber] = useState("");
  const [oabState, setOabState] = useState("");
  // Caminho do arquivo dentro do bucket privado `office-logos`.
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (profileData) {
      setOfficeName(profileData.office_name ?? "");
      setOabNumber(profileData.oab_number ?? "");
      setOabState(profileData.oab_state ?? "");
      loadExtendedProfile();
    }
  }, [profileData]);

  const loadExtendedProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, office_address, office_phone, office_email, office_logo_url")
      .eq("user_id", user.id)
      .single();
    if (!data) return;
    const row = data as Record<string, string | null>;
    setFullName(row.full_name ?? "");
    setOfficeAddress(row.office_address ?? "");
    setOfficePhone(row.office_phone ?? "");
    setOfficeEmail(row.office_email ?? "");
    setLogoPath(logoStoragePath(row.office_logo_url));
  };



  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim() || null,
      office_name: officeName.trim() || null,
      oab_number: oabNumber.trim() || null,
      oab_state: oabState || null,
      office_address: officeAddress.trim() || null,
      office_phone: officePhone.trim() || null,
      office_email: officeEmail.trim() || null,
      office_logo_url: logoPath,
      updated_at: new Date().toISOString(),
    } as never).eq("user_id", user.id);

    setSaving(false);
    if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
    toast({ title: "Configurações salvas" });
    await refreshProfile();
  };




  const UF_OPTIONS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

  return (
    <PlanGate
      requiredPlan="escritorio"
      title="Configurações de escritório são exclusivas do plano Escritório"
      description="Timbre com logo e dados do escritório no cabeçalho das petições exportadas, além do maior volume mensal de consultas, análises e petições."
    >
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Escritório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nome completo do advogado</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome que assina a petição" /></div>
          <div><Label>Nome do Escritório</Label><Input value={officeName} onChange={(e) => setOfficeName(e.target.value)} placeholder="Escritório de Advocacia" /></div>
          <div><Label>Endereço</Label><Input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="Rua, número, cidade - UF" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Telefone</Label><Input value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} placeholder="(00) 0000-0000" /></div>
            <div><Label>Email do Escritório</Label><Input value={officeEmail} onChange={(e) => setOfficeEmail(e.target.value)} placeholder="contato@escritorio.com" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Número OAB</Label><Input value={oabNumber} onChange={(e) => setOabNumber(e.target.value)} placeholder="123456" /></div>
            <div>
              <Label>UF da OAB</Label>
              <Select value={oabState} onValueChange={setOabState}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>{UF_OPTIONS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Nome e OAB entram no bloco de assinatura da petição exportada. Nome do escritório, endereço,
            telefone e e-mail formam o timbre do cabeçalho.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo do Escritório</CardTitle>
        </CardHeader>
        <CardContent>
          {user && (
            <LogoUploadField userId={user.id} value={logoPath} onChange={setLogoPath} />
          )}
        </CardContent>

      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
    </PlanGate>
  );
}

