import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PlanGate } from "@/components/PlanGate";
import { LOGO_ACCEPT, LOGO_BUCKET, LOGO_MAX_BYTES, logoStoragePath } from "@/lib/petitionBranding";

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
    const path = logoStoragePath(row.office_logo_url);
    setLogoPath(path);
    if (path) void refreshPreview(path);
  };

  // Bucket privado: a pré-visualização usa URL assinada de curta duração.
  const refreshPreview = async (path: string) => {
    const { data } = await supabase.storage.from(LOGO_BUCKET).createSignedUrl(path, 300);
    setLogoPreview(data?.signedUrl ?? null);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    // O jsPDF só desenha PNG e JPEG — SVG quebraria só na hora da exportação.
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast({
        title: "Formato não aceito",
        description: "Envie o logo em PNG ou JPEG. SVG não é suportado na exportação em PDF.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast({ title: "Arquivo muito grande (máx 2MB)", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${user.id}/logo.${ext}`;
    const { error } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    setUploading(false);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return;
    }
    setLogoPath(path);
    await refreshPreview(path);
    toast({ title: "Logo enviado", description: "Clique em Salvar Configurações para aplicá-lo às petições." });
  };

  const removeLogo = () => { setLogoPath(null); setLogoPreview(null); };

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
        <CardContent className="space-y-4">
          {logoPreview ? (
            <div className="flex items-center gap-4">
              <img src={logoPreview} alt="Logo do escritório" className="h-16 w-16 object-contain rounded border" />
              <Button variant="ghost" size="sm" onClick={removeLogo}><X className="mr-1 h-4 w-4" /> Remover</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum logo enviado.</p>
          )}
          <div>
            <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Enviar logo (PNG ou JPEG, máx 2MB)"}
            </Label>
            <input id="logo-upload" type="file" accept={LOGO_ACCEPT} className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            <p className="mt-2 text-xs text-muted-foreground">
              Apenas PNG e JPEG. Arquivos SVG não são aceitos porque não podem ser desenhados no PDF.
              A proporção original é preservada no cabeçalho.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
    </PlanGate>
  );
}

