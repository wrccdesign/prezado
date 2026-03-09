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

export function SettingsTab() {
  const { user } = useAuth();
  const { profileData, refreshProfile } = useUserProfile();

  const [officeName, setOfficeName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officeEmail, setOfficeEmail] = useState("");
  const [oabNumber, setOabNumber] = useState("");
  const [oabState, setOabState] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profileData) {
      setOfficeName(profileData.office_name ?? "");
      setOabNumber(profileData.oab_number ?? "");
      setOabState(profileData.oab_state ?? "");
      // These fields come from extended profile
      loadExtendedProfile();
    }
  }, [profileData]);

  const loadExtendedProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("office_address, office_phone, office_email, office_logo_url")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setOfficeAddress((data as any).office_address ?? "");
      setOfficePhone((data as any).office_phone ?? "");
      setOfficeEmail((data as any).office_email ?? "");
      setLogoUrl((data as any).office_logo_url ?? null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      office_name: officeName.trim() || null,
      oab_number: oabNumber.trim() || null,
      oab_state: oabState || null,
      office_address: officeAddress.trim() || null,
      office_phone: officePhone.trim() || null,
      office_email: officeEmail.trim() || null,
      office_logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    setSaving(false);
    if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
    toast({ title: "Configurações salvas" });
    await refreshProfile();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande (máx 2MB)", variant: "destructive" });
      return;
    }
    setUploading(true);
    const path = `${user.id}/logo.${file.name.split(".").pop()}`;

    const { error } = await supabase.storage.from("office-logos").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("office-logos").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Logo enviado" });
  };

  const removeLogo = () => setLogoUrl(null);

  const UF_OPTIONS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do Escritório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo do Escritório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl ? (
            <div className="flex items-center gap-4">
              <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded border" />
              <Button variant="ghost" size="sm" onClick={removeLogo}><X className="mr-1 h-4 w-4" /> Remover</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum logo enviado.</p>
          )}
          <div>
            <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Enviar logo (máx 2MB)"}
            </Label>
            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </div>
  );
}
