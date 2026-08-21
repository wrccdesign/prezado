import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
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

/**
 * Passo curto exibido no primeiro acesso de quem entrou por login social,
 * já que o formulário de cadastro por e-mail não é percorrido nesse fluxo.
 */
export function ProfileOnboardingDialog() {
  const { user } = useAuth();
  const { profileData, loading, updateProfile } = useUserProfile();
  const { toast } = useToast();

  const [isLawyer, setIsLawyer] = useState(false);
  const [oabNumber, setOabNumber] = useState("");
  const [oabState, setOabState] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [officeName, setOfficeName] = useState("");
  const [saving, setSaving] = useState(false);

  const open = Boolean(user) && !loading && Boolean(profileData) && profileData?.onboarding_completed === false;
  if (!open) return null;

  const toggleSpecialty = (id: string) =>
    setSelectedSpecialties((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const save = async (asLawyer: boolean) => {
    setSaving(true);
    try {
      await updateProfile(
        asLawyer
          ? {
              profile_type: "advogado",
              oab_number: oabNumber.trim() || null,
              oab_state: oabState || null,
              specialties: selectedSpecialties,
              office_name: officeName.trim() || null,
              onboarding_completed: true,
            }
          : { profile_type: "cidadao", onboarding_completed: true },
      );
    } catch {
      toast({ title: "Não foi possível salvar", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const canSaveLawyer = oabNumber.trim().length > 0 && oabState.length > 0;

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} hideClose>
        <DialogHeader>
          <DialogTitle>Complete seu perfil</DialogTitle>
          <DialogDescription>
            Isso ajusta a linguagem das análises e libera os recursos do Painel do Advogado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="onb-is-lawyer" className="text-sm font-medium">Você é advogado?</Label>
            <Switch id="onb-is-lawyer" checked={isLawyer} onCheckedChange={setIsLawyer} />
          </div>

          {isLawyer && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="onb-oab">Número OAB</Label>
                  <Input id="onb-oab" value={oabNumber} onChange={(e) => setOabNumber(e.target.value)} placeholder="123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="onb-uf">Estado</Label>
                  <Select value={oabState} onValueChange={setOabState}>
                    <SelectTrigger id="onb-uf"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Especialidades</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALTIES.map((spec) => (
                    <div key={spec.id} className="flex items-center space-x-2">
                      <Checkbox id={`onb-spec-${spec.id}`} checked={selectedSpecialties.includes(spec.id)} onCheckedChange={() => toggleSpecialty(spec.id)} />
                      <label htmlFor={`onb-spec-${spec.id}`} className="text-sm font-medium leading-none cursor-pointer">{spec.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onb-office">Nome do escritório (opcional)</Label>
                <Input id="onb-office" value={officeName} onChange={(e) => setOfficeName(e.target.value)} placeholder="Ex: Advocacia Silva & Associados" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              className="w-full sm:w-auto"
              disabled={saving || (isLawyer && !canSaveLawyer)}
              onClick={() => save(isLawyer)}
            >
              {saving ? "Salvando..." : "Salvar e continuar"}
            </Button>
            <Button variant="ghost" className="w-full sm:w-auto" disabled={saving} onClick={() => save(false)}>
              Continuar como cidadão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
