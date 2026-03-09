import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Download, Copy, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

interface Petition {
  id: string;
  petition_type: string;
  created_at: string;
  generated_text: string;
  form_data: any;
  client_id: string | null;
}

const TYPE_OPTIONS = [
  { value: "trabalhista", label: "Trabalhista" },
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
  { value: "familia", label: "Família" },
  { value: "consumidor", label: "Consumidor" },
  { value: "previdenciario", label: "Previdenciário" },
];

export function PetitionsTab() {
  const { user } = useAuth();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewPetition, setViewPetition] = useState<Petition | null>(null);

  useEffect(() => {
    if (user) fetchPetitions();
  }, [user]);

  const fetchPetitions = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("petitions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPetitions((data as Petition[]) ?? []);
    setLoading(false);
  };

  const filtered = petitions.filter((p) => {
    if (filterType !== "all" && p.petition_type !== filterType) return false;
    if (searchTerm && !p.generated_text.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const downloadPDF = (p: Petition) => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(p.generated_text, 170);
    doc.setFontSize(11);
    doc.text(lines, 20, 20);
    doc.save(`peticao-${p.petition_type}-${format(new Date(p.created_at), "yyyy-MM-dd")}.pdf`);
  };

  const downloadDOCX = async (p: Petition) => {
    const paragraphs = p.generated_text.split("\n").map(
      (line) => new Paragraph({ children: [new TextRun(line)] })
    );
    const doc = new Document({ sections: [{ children: paragraphs }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peticao-${p.petition_type}-${format(new Date(p.created_at), "yyyy-MM-dd")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const duplicate = async (p: Petition) => {
    if (!user) return;
    const { error } = await supabase.from("petitions").insert({
      user_id: user.id,
      petition_type: p.petition_type,
      form_data: p.form_data,
      generated_text: p.generated_text,
      client_id: p.client_id,
    });
    if (error) { toast({ title: "Erro ao duplicar", variant: "destructive" }); return; }
    toast({ title: "Petição duplicada" });
    fetchPetitions();
  };

  const deletePetition = async (id: string) => {
    const { error } = await supabase.from("petitions").delete().eq("id", id);
    if (error) { toast({ title: "Erro ao excluir", variant: "destructive" }); return; }
    toast({ title: "Petição excluída" });
    fetchPetitions();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Buscar no texto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:max-w-xs" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {TYPE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="animate-pulse text-muted-foreground py-8 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nenhuma petição encontrada.</CardContent></Card>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{TYPE_OPTIONS.find(t => t.value === p.petition_type)?.label || p.petition_type}</TableCell>
                  <TableCell>{format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewPetition(p)} title="Visualizar"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPDF(p)} title="PDF"><Download className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadDOCX(p)} title="DOCX"><Download className="h-3.5 w-3.5 text-primary" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(p)} title="Duplicar"><Copy className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePetition(p.id)} title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!viewPetition} onOpenChange={() => setViewPetition(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Petição - {viewPetition && (TYPE_OPTIONS.find(t => t.value === viewPetition.petition_type)?.label || viewPetition.petition_type)}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{viewPetition?.generated_text}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
