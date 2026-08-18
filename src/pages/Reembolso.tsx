import { LegalPageLayout } from "@/components/LegalPageLayout";

export default function Reembolso() {
  return (
    <LegalPageLayout
      title="Política de Reembolso"
      description="Política de reembolso da plataforma Honorífico — garantia de 30 dias."
      path="/reembolso"
      updatedAt="10 de julho de 2026"
    >
      <h2>Garantia de satisfação de 30 dias</h2>
      <p>
        Oferecemos uma <strong>garantia de reembolso de 30 dias</strong> a partir da data da compra ou
        renovação da assinatura. Se você não estiver satisfeito com o Honorífico, pode solicitar o reembolso
        integral do valor pago dentro deste prazo, sem necessidade de justificar.
      </p>

      <h2>Como solicitar o reembolso</h2>
      <p>
        As assinaturas são vendidas pelo <strong>Honorífico</strong>, entidade sediada na Irlanda, e os
        pagamentos são processados com segurança pela <strong>Stripe</strong>. Para solicitar reembolso:
      </p>
      <ol>
        <li>
          Acesse <a href="/conta">Minha conta</a> e localize a fatura correspondente; e
        </li>
        <li>
          Envie um e-mail para <a href="mailto:wrccdesign@gmail.com">wrccdesign@gmail.com</a> com o comprovante
          da compra que retornaremos em até 2 dias úteis.
        </li>
      </ol>
      <p>
        Reembolsamos integralmente o valor da assinatura. Eventuais encargos cobrados pelo seu banco em
        compras internacionais (como IOF ou tarifa de conversão) não são recebidos por nós e seguem a
        política da instituição emissora do cartão.
      </p>

      <h2>Como o reembolso é processado</h2>
      <ul>
        <li>Reembolsos aprovados são creditados no mesmo meio de pagamento utilizado, em até <strong>5 a 10 dias úteis</strong>, dependendo do banco ou operadora do cartão.</li>
        <li>O reembolso é integral: cobramos apenas o valor da assinatura, sem taxa de cancelamento.</li>
        <li>Após o reembolso, o acesso aos recursos pagos é revogado imediatamente e a conta retorna ao plano gratuito.</li>
      </ul>

      <h2>Após o prazo de 30 dias</h2>
      <p>
        Assinaturas mensais podem ser canceladas a qualquer momento a partir do portal do assinante — o
        cancelamento evita cobranças futuras, e você mantém o acesso aos recursos pagos até o final do
        período já pago. Não há reembolso proporcional do período não utilizado após 30 dias da compra,
        salvo obrigação legal.
      </p>

      <h2>Casos especiais</h2>
      <ul>
        <li><strong>Cobrança duplicada ou não reconhecida:</strong> reembolso integral, independentemente do prazo. Escreva imediatamente para <a href="mailto:wrccdesign@gmail.com">wrccdesign@gmail.com</a>.</li>
        <li><strong>Falha do Serviço:</strong> se o Serviço estiver indisponível por período prolongado, avalie reembolso proporcional junto ao suporte.</li>
        <li><strong>Estorno (<em>chargeback</em>):</strong> incentivamos o contato prévio conosco antes de abrir estorno no cartão — resolvemos com mais rapidez.</li>
      </ul>

      <h2>Contato</h2>
      <p>
        Dúvidas sobre pagamento, fatura ou reembolso: <a href="mailto:wrccdesign@gmail.com">wrccdesign@gmail.com</a>.
      </p>
    </LegalPageLayout>
  );
}
