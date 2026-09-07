import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setPendingRedirect } from "@/lib/authRedirect";
import Logo from "@/components/Logo";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: { message: string } | null }>;
};

function oauthApi(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!authorizationId) {
        setError("Pedido de autorização sem identificador.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        setPendingRedirect(next);
        window.location.href = `/auth?next=${encodeURIComponent(next)}`;
        return;
      }
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O servidor de autorização não devolveu um endereço de retorno.");
      return;
    }
    window.location.href = target;
  }

  const nomeCliente = details?.client?.name ?? "o aplicativo";

  return (
    <main className="min-h-screen bg-cream text-navy flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[52ch] bg-white border border-cream-dark rounded-lg p-8">
        <Logo className="h-8" />
        {error ? (
          <>
            <h1 className="font-serif text-h3 mt-6">Não foi possível carregar este pedido</h1>
            <p className="text-base text-navy/70 mt-3">{error}</p>
          </>
        ) : !details ? (
          <p className="text-base text-navy/70 mt-6">Carregando…</p>
        ) : (
          <>
            <h1 className="font-serif text-h3 mt-6">Conectar {nomeCliente} à sua conta</h1>
            <p className="text-base text-navy/70 mt-3">
              Ao aprovar, {nomeCliente} poderá usar as ferramentas do Honorífico em seu nome: buscar
              decisões e súmulas do acervo e ler os itens salvos no seu histórico.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                disabled={busy}
                onClick={() => decide(true)}
                className="px-4 py-2 rounded bg-gold text-navy text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-60"
              >
                Aprovar
              </button>
              <button
                disabled={busy}
                onClick={() => decide(false)}
                className="px-4 py-2 rounded border border-navy/20 text-sm font-medium hover:bg-cream transition-colors disabled:opacity-60"
              >
                Recusar
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
