import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  document: string | null;
  contact: string | null;
  email: string | null;
  area: string | null;
  notes: string | null;
  created_at: string;
}

const AREA_OPTIONS = [
  { value: "civil", label: "Civil" },
  { value: "trabalhista", label: "Trabalhista" },
  { value: "criminal", label: "Criminal" },
  { value: "familia", label: "Família" },
  { value: "tributario", label: "Tributário" },
  { value: "empresarial", label: "Empresarial" },
  { value: "previdenciario", label: "Previdenciário" },
  { value: "consumidor", label: "Consumidor" },
  { value: "ambiental", label: "Ambiental" },
];

export function ClientsTab() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPetitions, setClientPetitions] = useState<any[]>([]);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDocument, setFormDocument] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    if (user) fetchClients();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    setClients((data as Client[]) ?? []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setFormName(""); setFormDocument(""); setFormContact(""); setFormEmail(""); setFormArea(""); setFormNotes("");
    setDialogOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setFormName(c.name); setFormDocument(c.document ?? ""); setFormContact(c.contact ?? "");
    setFormEmail(c.email ?? ""); setFormArea(c.area ?? ""); setFormNotes(c.notes ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formName.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    const payload = {
      user_id: user.id,
      name: formName.trim(),
      document: formDocument.trim() || null,
      contact: formContact.trim() || null,
      email: formEmail.trim() || null,
      area: formArea || null,
      notes: formNotes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
      toast({ title: "Cliente atualizado" });
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) { toast({ title: "Erro ao criar cliente", variant: "destructive" }); return; }
      toast({ title: "Cliente criado" });
    }
    setDialogOpen(false);
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Cliente excluído" });
    fetchClients();
  };

  const viewClient = async (c: Client) => {
    setSelectedClient(c);
    if (!user) return;
    const { data } = await supabase
      .from("petitions")
      .select("id, petition_type, created_at")
      .eq("user_id", user.id)
      .eq("client_id", c.id)
      .order("created_at", { ascending: false });
    setClientPetitions(data ?? []);
  };

  if (selectedClient) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedClient.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {selectedClient.document && <p><span className="font-medium">CPF/CNPJ:</span> {selectedClient.document}</p>}
            {selectedClient.contact && <p><span className="font-medium">Contato:</span> {selectedClient.contact}</p>}
            {selectedClient.email && <p><span className="font-medium">Email:</span> {selectedClient.email}</p>}
            {selectedClient.area && <Badge variant="secondary">{AREA_OPTIONS.find(a => a.value === selectedClient.area)?.label || selectedClient.area}</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Petições do Cliente</CardTitle></CardHeader>
          <CardContent>
            {clientPetitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma petição vinculada.</p>
            ) : (
              <div className="space-y-2">
                {clientPetitions.map((p) => (
                  <div key={p.id} className="flex justify-between border-b pb-2 last:border-0 text-sm">
                    <span>{p.petition_type}</span>
                    <span className="text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-serif">Clientes</h2>
        <Button size="sm" onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
      </div>

      {loading ? (
        <div className="animate-pulse text-muted-foreground py-8 text-center">Carregando...</div>
      ) : clients.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</CardContent></Card>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">CPF/CNPJ</TableHead>
                <TableHead className="hidden md:table-cell">Área</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => viewClient(c)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.document || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.area ? <Badge variant="secondary" className="text-xs">{AREA_OPTIONS.find(a => a.value === c.area)?.label || c.area}</Badge> : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome completo" /></div>
            <div><Label>CPF/CNPJ</Label><Input value={formDocument} onChange={(e) => setFormDocument(e.target.value)} placeholder="000.000.000-00" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Contato</Label><Input value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="(00) 00000-0000" /></div>
              <div><Label>Email</Label><Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            </div>
            <div>
              <Label>Área do Direito</Label>
              <Select value={formArea} onValueChange={setFormArea}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {AREA_OPTIONS.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notas sobre o cliente" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
