import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Leva a janela ao topo a cada troca de caminho. Navegação "POP" (voltar ou
 * avançar pelo navegador) preserva a posição de leitura, e mudança apenas de
 * query string (por exemplo ?q= na Jurisprudência) não reposiciona.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
