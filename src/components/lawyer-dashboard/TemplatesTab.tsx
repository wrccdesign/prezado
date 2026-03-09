import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Template {
  id: string;
  name: string;
  area: string | null;
  petition_type: string;
  form_data: any;
  generated_text: string;
  created_at: string;
}

const TYPE_OPTIONS = [
  { value: "trabalhista", label: "Trabalhista" },
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
  { value: "familia", label: "Família" },
  { value: "consumidor", label: "Consumidor" },
  { value: "previdenciario", label: "Previdenciário" },
];

const AREA_OPTIONS = [
  { value: "civil", label: "Civil" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "criminal", label: "Criminal" },
  { value: "familia", label: "Família" },
  { value: "tributario", label: "Tributário" },
  { value: "empresarial", label: "Empresarial" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "consumidor", label: "Consumidor" },
];

export function TemplatesTab() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [viewTemplate, setViewTemplate] = useState<Template | null>(null);

  const [formName, setFormName] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formType, setFormType] = useState("");

  // For "save from petition" flow
  const [petitions, setPetitions] = useState<any[]>([]);
  const [selectedPetitionId, setSelectedPetitionId] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveArea, setSaveArea] = useState("");

  useEffect(() => {
    if (user) fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("petition_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTemplates((data as Template[]) ?? []);
    setLoading(false);
  };

  const openSaveFromPetition = async () => {
    if (!user) return;
    const { data } = await supabase.from("petitions").select("id, petition_type, created_at, form_data, generated_text").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setPetitions(data ?? []);
    setSelectedPetitionId("");
    setSaveName("");
    setSaveArea("");
    setSaveDialogOpen(true);
  };

  const handleSaveFromPetition = async () => {
    if (!user || !selectedPetitionId || !saveName.trim()) {
      toast({ title: "Selecione uma petição e dê um nome", variant: "destructive" });
      return;
    }
    const petition = petitions.find((p) => p.id === selectedPetitionId);
    if (!petition) return;

    const { error } = await supabase.from("petition_templates").insert({
      user_id: user.id,
      name: saveName.trim(),
      area: saveArea || null,
      petition_type: petition.petition_type,
      form_data: petition.form_data,
      generated_text: petition.generated_text,
    });
    if (error) { toast({ title: "Erro ao salvar modelo", variant: "destructive" }); return; }
    toast({ title: "Modelo salvo com sucesso" });
    setSaveDialogOpen(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("petition_templates").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Modelo excluído" });
    fetchTemplates();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-serif">Meus Modelos</h2>
        <Button size="sm" onClick={openSaveFromPetition}>
          <Plus className="mr-2 h-4 w-4" /> Salvar de Petição
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse text-muted-foreground py-8 text-center">Carregando...</div>
      ) : templates.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum modelo salvo ainda. Salve uma petição como modelo para reutilizar.</CardContent></Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewTemplate(t)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {t.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">{TYPE_OPTIONS.find(o => o.value === t.petition_type)?.label || t.petition_type}</Badge>
                  {t.area && <Badge variant="secondary" className="text-xs">{AREA_OPTIONS.find(a => a.value === t.area)?.label || t.area}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Save from petition dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Salvar Petição como Modelo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecione a Petição</Label>
              <Select value={selectedPetitionId} onValueChange={setSelectedPetitionId}>
                <SelectTrigger><SelectValue placeholder="Escolha uma petição" /></SelectTrigger>
                <SelectContent>
                  {petitions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {TYPE_OPTIONS.find(t => t.value === p.petition_type)?.label || p.petition_type} — {format(new Date(p.created_at), "dd/MM/yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nome do Modelo *</Label><Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Ex: Petição Inicial Trabalhista Padrão" /></div>
            <div>
              <Label>Área do Direito</Label>
              <Select value={saveArea} onValueChange={setSaveArea}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {AREA_OPTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveFromPetition}>Salvar Modelo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View template dialog */}
      <Dialog open={!!viewTemplate} onOpenChange={() => setViewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewTemplate?.name}</DialogTitle></DialogHeader>
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{viewTemplate?.generated_text}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
