/**
 * Geração do card de resultado para compartilhamento (PNG 1080x1350).
 * Usa a Canvas API do navegador, sem dependência externa.
 */

const CREAM = "#F6F3EE";
const CREAM_DARK = "#E6E1D9";
const NAVY = "#0B1628";
const GOLD = "#CEA546";

const SERIF = '"Source Serif 4", Georgia, serif';
const SANS = '"Source Sans 3", system-ui, sans-serif';

export interface ShareCardData {
  titulo: string;
  valorOriginal: string;
  valorFinal: string;
  periodo: string;
  indice: string;
  nota: string;
  rodape: string;
}

async function ensureFonts() {
  try {
    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }
  } catch {
    /* fontes de fallback são suficientes */
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  await ensureFonts();

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");

  const M = 90;

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);

  // linha dourada no topo
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, W, 10);

  let y = 190;

  ctx.fillStyle = NAVY;
  ctx.font = `500 62px ${SERIF}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(data.titulo, M, y);

  y += 70;
  ctx.strokeStyle = CREAM_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(W - M, y);
  ctx.stroke();

  // valor original
  y += 90;
  ctx.fillStyle = "rgba(11,22,40,0.6)";
  ctx.font = `400 30px ${SANS}`;
  ctx.fillText("Valor original", M, y);
  y += 60;
  ctx.fillStyle = NAVY;
  ctx.font = `500 56px ${SERIF}`;
  ctx.fillText(data.valorOriginal, M, y);

  // valor final
  y += 110;
  ctx.fillStyle = "rgba(11,22,40,0.6)";
  ctx.font = `400 30px ${SANS}`;
  ctx.fillText("Valor atualizado", M, y);
  y += 120;
  ctx.fillStyle = NAVY;
  ctx.font = `500 116px ${SERIF}`;
  const valorLines = wrap(ctx, data.valorFinal, W - M * 2);
  for (const l of valorLines) {
    ctx.fillText(l, M, y);
    y += 124;
  }

  y += 20;
  ctx.strokeStyle = CREAM_DARK;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(W - M, y);
  ctx.stroke();

  // período e índice
  const rows: Array<[string, string]> = [
    ["Período", data.periodo],
    ["Índice", data.indice],
  ];
  for (const [label, value] of rows) {
    y += 72;
    ctx.fillStyle = "rgba(11,22,40,0.6)";
    ctx.font = `400 30px ${SANS}`;
    ctx.fillText(label, M, y);
    ctx.fillStyle = NAVY;
    ctx.font = `500 32px ${SANS}`;
    ctx.textAlign = "right";
    ctx.fillText(value, W - M, y);
    ctx.textAlign = "left";
    y += 22;
    ctx.strokeStyle = CREAM_DARK;
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(W - M, y);
    ctx.stroke();
  }

  // nota
  y += 80;
  ctx.fillStyle = "rgba(11,22,40,0.72)";
  ctx.font = `400 32px ${SANS}`;
  for (const l of wrap(ctx, data.nota, W - M * 2)) {
    ctx.fillText(l, M, y);
    y += 44;
  }

  // rodapé
  ctx.fillStyle = "rgba(11,22,40,0.5)";
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText(data.rodape, M, H - 80);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Falha ao gerar a imagem"))), "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
