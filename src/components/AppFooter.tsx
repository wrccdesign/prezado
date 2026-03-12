import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function AppFooter() {
  return (
    <footer
      className="py-12 border-t mt-auto"
      style={{ backgroundColor: "hsl(218 60% 5%)", borderColor: "hsl(var(--gold) / 0.15)" }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">
          {/* Plataforma */}
          <div>
            <h4 className="font-sans font-semibold text-white text-sm mb-4">Plataforma</h4>
            <ul className="space-y-2">
              {[
                { label: "Análise Jurídica", to: "/" },
                { label: "Petições", to: "/peticao" },
                { label: "Chat Jurídico", to: "/chat" },
                { label: "Calculadoras", to: "/calculadoras" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-white/40 hover:text-[hsl(var(--gold))] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-sans font-semibold text-white text-sm mb-4">Recursos</h4>
            <ul className="space-y-2">
              {[
                { label: "Diagnóstico", to: "/diagnostico" },
                { label: "Histórico", to: "/historico" },
                { label: "Painel do Advogado", to: "/painel-advogado" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-white/40 hover:text-[hsl(var(--gold))] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sobre */}
          <div>
            <h4 className="font-sans font-semibold text-white text-sm mb-4">Sobre</h4>
            <div className="mb-3">
              <img src={logo} alt="JurisAI" className="h-7" />
            </div>
            <p className="text-sm text-white/40 leading-relaxed">
              Inteligência Artificial Jurídica Brasileira. Ferramentas de análise, petições e consultoria com IA para advogados e cidadãos.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div
          className="border-t pt-5 flex flex-col items-center gap-2 text-center"
          style={{ borderColor: "hsl(var(--gold) / 0.1)" }}
        >
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} JurisAI. Todos os direitos reservados.
          </p>
          <p className="text-xs text-white/25">
            Desenvolvido por{" "}
            <a
              href="https://www.wrcc.design"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[hsl(var(--gold))] transition-colors underline underline-offset-2"
            >
              WRCC Design
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
