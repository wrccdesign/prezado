import { supabase } from "@/integrations/supabase/client";

/**
 * Dados do advogado/escritório usados no cabeçalho e na assinatura das
 * petições exportadas (PDF e DOCX).
 */
export interface PetitionBranding {
  fullName: string | null;
  oabNumber: string | null;
  oabState: string | null;
  officeName: string | null;
  officeAddress: string | null;
  officePhone: string | null;
  officeEmail: string | null;
  logo: PetitionLogo | null;
}

export interface PetitionLogo {
  /** data:image/png;base64,... — pronto para jsPDF e para o docx. */
  dataUrl: string;
  format: "PNG" | "JPEG";
  width: number;
  height: number;
}

export const LOGO_BUCKET = "office-logos";
export const LOGO_ACCEPT = "image/png,image/jpeg";
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/**
 * O valor gravado em `office_logo_url` pode ser um caminho (`<uid>/logo.png`)
 * ou, em registros antigos, uma URL pública completa. Em ambos os casos
 * extraímos o caminho relativo ao bucket — ele é privado, então o download
 * autenticado é o único caminho que funciona.
 */
export function logoStoragePath(value: string | null | undefined): string | null {
  if (!value) return null;
  const marker = `/${LOGO_BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx >= 0) return value.slice(idx + marker.length);
  return value.replace(/^\/+/, "");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(blob);
  });
}

function measure(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.src = dataUrl;
  });
}

/**
 * Baixa o logo do bucket privado e devolve data URL + dimensões naturais.
 * Qualquer falha devolve null: a exportação continua em cabeçalho de texto.
 */
export async function loadLogo(rawValue: string | null | undefined): Promise<PetitionLogo | null> {
  const path = logoStoragePath(rawValue);
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage.from(LOGO_BUCKET).download(path);
    if (error || !data) return null;
    const type = data.type?.toLowerCase() ?? "";
    if (!type.includes("png") && !type.includes("jpeg") && !type.includes("jpg")) return null;
    const dataUrl = await blobToDataUrl(data);
    const { width, height } = await measure(dataUrl);
    if (!width || !height) return null;
    return { dataUrl, format: type.includes("png") ? "PNG" : "JPEG", width, height };
  } catch (err) {
    console.warn("Logo do escritório indisponível; exportando sem timbre.", err);
    return null;
  }
}

/**
 * Carrega o perfil para a exportação. `withOffice` (plano Escritório) decide
 * se o timbre — dados e logo — entra no cabeçalho.
 */
export async function loadPetitionBranding(
  userId: string,
  withOffice: boolean,
): Promise<PetitionBranding> {
  const empty: PetitionBranding = {
    fullName: null, oabNumber: null, oabState: null, officeName: null,
    officeAddress: null, officePhone: null, officeEmail: null, logo: null,
  };
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, oab_number, oab_state, office_name, office_address, office_phone, office_email, office_logo_url")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return empty;

    const row = data as Record<string, string | null>;
    const branding: PetitionBranding = {
      fullName: row.full_name?.trim() || null,
      oabNumber: row.oab_number?.trim() || null,
      oabState: row.oab_state?.trim() || null,
      officeName: withOffice ? row.office_name?.trim() || null : null,
      officeAddress: withOffice ? row.office_address?.trim() || null : null,
      officePhone: withOffice ? row.office_phone?.trim() || null : null,
      officeEmail: withOffice ? row.office_email?.trim() || null : null,
      logo: null,
    };
    if (withOffice) branding.logo = await loadLogo(row.office_logo_url);
    return branding;
  } catch (err) {
    console.warn("Não foi possível carregar os dados do escritório.", err);
    return empty;
  }
}

/** Linha de contato do timbre: endereço · telefone · e-mail. */
export function contactLine(b: PetitionBranding): string | null {
  const parts = [b.officeAddress, b.officePhone, b.officeEmail].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/** Assinatura: nome e OAB quando existirem, senão a linha genérica. */
export function signatureLines(b: PetitionBranding): string[] {
  const lines: string[] = [];
  if (b.fullName) lines.push(b.fullName);
  if (b.oabNumber && b.oabState) lines.push(`OAB/${b.oabState} nº ${b.oabNumber}`);
  return lines.length ? lines : ["Advogado(a) / OAB"];
}

export function hasLetterhead(b: PetitionBranding): boolean {
  return !!(b.officeName || b.logo || contactLine(b));
}
