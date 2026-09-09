import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LOGO_ACCEPT, LOGO_BUCKET, LOGO_MAX_BYTES } from "@/lib/petitionBranding";

export const LOGO_CAPTION =
  "Este é o logo que aparecerá no cabeçalho das petições exportadas em PDF e DOCX.";

interface LogoUploadFieldProps {
  userId: string;
  /** Caminho do arquivo no bucket privado (`<uid>/logo.png`) ou null. */
  value: string | null;
  onChange: (path: string | null) => void;
  inputId?: string;
}

/**
 * Upload, pré-visualização e remoção do logo usado no timbre das petições.
 * Compartilhado entre o painel do advogado e a página de conta.
 */
export function LogoUploadField({ userId, value, onChange, inputId = "logo-upload" }: LogoUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setPreview(null);
      return;
    }
    // Bucket privado: a pré-visualização usa URL assinada de curta duração.
    supabase.storage
      .from(LOGO_BUCKET)
      .createSignedUrl(value, 300)
      .then(({ data }) => {
        if (!cancelled) setPreview(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
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
    const path = `${userId}/logo.${ext}`;
    const { error } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    setUploading(false);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return;
    }
    onChange(path);
    toast({ title: "Logo enviado", description: "Clique em Salvar para aplicá-lo às petições." });
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="flex items-center gap-4">
          <img src={preview} alt="Logo do timbre" className="h-16 w-16 object-contain rounded border" />
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X className="mr-1 h-4 w-4" /> Remover
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum logo enviado.</p>
      )}
      <p className="text-xs text-muted-foreground">{LOGO_CAPTION}</p>
      <div>
        <Label
          htmlFor={inputId}
          className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Enviar logo (PNG ou JPEG, máx 2MB)"}
        </Label>
        <input
          id={inputId}
          type="file"
          accept={LOGO_ACCEPT}
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Apenas PNG e JPEG. Arquivos SVG não são aceitos porque não podem ser desenhados no PDF.
          A proporção original é preservada no cabeçalho.
        </p>
      </div>
    </div>
  );
}
