/**
 * Eventos GA4 (gtag G-BYDBC1Q8MD, carregado no index.html).
 * Nunca quebra quando o gtag não existe (bloqueador, ambiente local).
 * A atribuição (utm_* e ref) da primeira página da sessão vai em todo evento.
 */
type Params = Record<string, string | number | boolean | undefined | null>;

const ATTR_KEY = "hon_attr";
const ORIGEM_KEY = "hon_signup_origem";
export const ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "ref"] as const;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function safeSession(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** Guarda a atribuição da primeira página da sessão. Chamar uma vez ao carregar. */
export function captureAttribution(search = typeof window !== "undefined" ? window.location.search : "") {
  const s = safeSession();
  if (!s || s.getItem(ATTR_KEY)) return;
  const qs = new URLSearchParams(search);
  const attr: Record<string, string> = {};
  for (const k of ATTR_KEYS) {
    const v = qs.get(k);
    if (v) attr[k] = v.slice(0, 100);
  }
  s.setItem(ATTR_KEY, JSON.stringify(attr));
}

export function getAttribution(): Record<string, string> {
  try {
    return JSON.parse(safeSession()?.getItem(ATTR_KEY) || "{}");
  } catch {
    return {};
  }
}

export function track(evento: string, params: Params = {}) {
  try {
    const clean: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries({ ...getAttribution(), ...params })) {
      if (v !== undefined && v !== null && v !== "") clean[k] = v;
    }
    window.gtag?.("event", evento, clean);
  } catch {
    /* medição nunca derruba a tela */
  }
}

export type SignupOrigem = "export_gate" | "hero" | "planos" | "outro";

/** Marca de onde a pessoa saiu para criar conta (lido no sign_up). */
export function setSignupOrigem(origem: SignupOrigem, calculadora?: string) {
  try {
    window.localStorage.setItem(ORIGEM_KEY, JSON.stringify({ origem, calculadora }));
  } catch { /* ignore */ }
}

export function takeSignupOrigem(): { origem: SignupOrigem; calculadora?: string } {
  try {
    const raw = window.localStorage.getItem(ORIGEM_KEY);
    window.localStorage.removeItem(ORIGEM_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { origem: "outro" };
}

/** Dispara o evento só uma vez por chave (por navegador). */
export function trackOnce(chave: string, evento: string, params: Params = {}) {
  try {
    const k = `hon_once_${chave}`;
    if (window.localStorage.getItem(k)) return;
    window.localStorage.setItem(k, "1");
  } catch { /* segue e envia */ }
  track(evento, params);
}

/** Troca a atribuição de uma URL, sem tocar nos demais parâmetros. */
export function withAttribution(url: string, attr: Record<string, string>) {
  const u = new URL(url, "https://www.honorifico.com.br");
  for (const k of ATTR_KEYS) u.searchParams.delete(k);
  for (const [k, v] of Object.entries(attr)) u.searchParams.set(k, v);
  return u.toString();
}
