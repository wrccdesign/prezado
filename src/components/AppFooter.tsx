import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export function AppFooter() {
  return (
    <footer className="bg-navy border-t border-gold/12 py-14 mt-auto">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6 mb-12">
          <div>
            <h4 className="font-sans font-medium text-cream text-sm mb-4">Calculadoras</h4>
            <ul className="space-y-2">
              {[
                { label: "Correção monetária e juros", to: "/calculadoras/correcao-monetaria-juros-lei-14905" },
                { label: "Prazo processual", to: "/calculadoras/prazo-processual" },
                { label: "Custas do TJSP", to: "/calculadoras/custas-tjsp" },
                { label: "Operações com datas", to: "/calculadoras/operacoes-datas" },
                { label: "Validador CPF/CNPJ", to: "/calculadoras/validador-cpf-cnpj" },
                { label: "Rescisão trabalhista", to: "/calculadoras/rescisao-trabalhista" },
                { label: "Pensão alimentícia", to: "/calculadoras/pensao-alimenticia" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-cream/50 hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-medium text-cream text-sm mb-4">Plataforma</h4>
            <ul className="space-y-2">
              {[
                { label: "Jurisprudência", to: "/jurisprudencia" },
                { label: "Diagnóstico jurídico", to: "/diagnostico" },
                { label: "Petições", to: "/peticao" },
                { label: "Chat Jurídico", to: "/chat" },
                { label: "Painel do Advogado", to: "/painel-advogado" },
                { label: "Modelos de Minutas", to: "/modelos-de-minutas" },
                { label: "Por que o Honorífico", to: "/comparativo" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-cream/50 hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-medium text-cream text-sm mb-4">Conta</h4>
            <ul className="space-y-2">
              {[
                { label: "Planos e Preços", to: "/planos" },
                { label: "Minha Conta", to: "/conta" },
                { label: "Histórico", to: "/historico" },
                { label: "Mapa do Site", to: "/mapa-do-site" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-cream/50 hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-sans font-medium text-cream text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              {[
                { label: "Termos e Condições", to: "/termos" },
                { label: "Política de Reembolso", to: "/reembolso" },
                { label: "Aviso de Privacidade", to: "/privacidade" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-cream/50 hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h4 className="font-sans font-medium text-cream text-sm mb-4">Sobre</h4>
            <div className="mb-3">
              <Logo className="h-7" />
            </div>
            <p className="text-sm text-cream/50 leading-relaxed">
              Diagnóstico, análise de documentos, consulta processual e petição, com precedentes do CNJ. Calculadoras com séries do Banco Central e memória de cálculo.
            </p>
            <p className="text-xs text-cream/40 mt-3 leading-relaxed">
              Pagamentos processados com segurança via <strong className="text-cream/72">Stripe</strong>.
            </p>
          </div>
        </div>

        <div className="border-t border-gold/12 pt-5 flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-cream/40">
            © {new Date().getFullYear()} Honorífico. Todos os direitos reservados.
          </p>
          <p className="text-xs text-cream/40">
            Desenvolvido por{" "}
            <a
              href="https://www.wrcc.design"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold transition-colors underline underline-offset-2"
            >
              WRCC Design
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
