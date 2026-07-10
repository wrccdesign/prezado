import { LegalPageLayout } from "@/components/LegalPageLayout";

export default function Privacidade() {
  return (
    <LegalPageLayout
      title="Aviso de Privacidade"
      description="Aviso de Privacidade do Prezados.AI — como tratamos seus dados pessoais em conformidade com a LGPD."
      path="/privacidade"
      updatedAt="10 de julho de 2026"
    >
      <p>
        Este Aviso descreve como a <strong>Prezados.AI</strong> ("nós") coleta, usa, compartilha e protege
        seus dados pessoais no uso da plataforma Prezados.AI ("Serviço"), em conformidade com a Lei Geral de
        Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Controlador dos dados</h2>
      <p>
        A Prezados.AI é a <strong>controladora</strong> dos dados pessoais tratados no Serviço, respondendo
        pelas decisões sobre o tratamento. Para exercer seus direitos ou tirar dúvidas, use
        <a href="mailto:contato@prezados.ai"> contato@prezados.ai</a>.
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> e‑mail, nome, senha (armazenada com <em>hash</em>), perfil (cidadão ou advogado).</li>
        <li><strong>Perfil de advogado (opcional):</strong> número e UF da OAB, nome do escritório, endereço, telefone, e‑mail do escritório, logo.</li>
        <li><strong>Conteúdo enviado:</strong> descrições de situações, fatos e pedidos de petição, mensagens de chat, documentos carregados para análise.</li>
        <li><strong>Dados de uso:</strong> páginas visitadas, ações realizadas, contadores de uso diário por funcionalidade, data e hora de acesso, endereço IP, tipo de navegador/dispositivo.</li>
        <li><strong>Dados de pagamento:</strong> os dados de cartão e faturamento são coletados e processados diretamente pela Paddle.com; a Prezados.AI recebe apenas identificadores de transação, status da assinatura, plano contratado e e-mail do pagador.</li>
        <li><strong>Cookies estritamente necessários</strong> para autenticação e funcionamento do Serviço.</li>
      </ul>

      <h2>3. Finalidades e bases legais</h2>
      <table>
        <thead>
          <tr>
            <th>Finalidade</th>
            <th>Base legal (LGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Criar e gerenciar sua conta; entregar as funcionalidades contratadas</td><td>Execução de contrato (art. 7º, V)</td></tr>
          <tr><td>Processar pagamentos e cumprir obrigações fiscais</td><td>Execução de contrato / obrigação legal (art. 7º, II e V)</td></tr>
          <tr><td>Aplicar limites de uso, prevenir fraude e abuso, garantir segurança</td><td>Legítimo interesse (art. 7º, IX)</td></tr>
          <tr><td>Melhorar o Serviço, corrigir falhas, entender padrões de uso</td><td>Legítimo interesse (art. 7º, IX)</td></tr>
          <tr><td>Comunicações operacionais (fatura, alteração de plano, suporte)</td><td>Execução de contrato (art. 7º, V)</td></tr>
          <tr><td>Comunicações de marketing (opcional)</td><td>Consentimento (art. 7º, I) — revogável a qualquer momento</td></tr>
          <tr><td>Cumprir ordens judiciais e obrigações legais</td><td>Obrigação legal (art. 7º, II)</td></tr>
        </tbody>
      </table>

      <h2>4. Como usamos o conteúdo que você envia</h2>
      <p>
        Descrições, mensagens e documentos carregados são processados para gerar as respostas de IA que você
        solicitou. Trechos podem transitar por provedores de modelos de linguagem (ver seção 5). Aplicamos
        anonimização automatizada de dados sensíveis (CPF, dados de saúde) antes de compartilhamento público
        ou publicação em bases derivadas. <strong>Não vendemos seus dados</strong> e não utilizamos o conteúdo
        privado para treinar modelos de terceiros.
      </p>

      <h2>5. Compartilhamento com terceiros (operadores)</h2>
      <p>Compartilhamos dados estritamente necessários com os seguintes tipos de operadores:</p>
      <ul>
        <li><strong>Provedor de infraestrutura em nuvem</strong> (hospedagem, banco de dados, autenticação, armazenamento de arquivos).</li>
        <li><strong>Provedor de modelos de IA</strong> — processamento dos prompts enviados por você para gerar respostas.</li>
        <li><strong>Provedor de embeddings jurídicos</strong> — geração de representações vetoriais para busca semântica.</li>
        <li><strong>Paddle.com Market Limited</strong> — <em>Merchant of Record</em> responsável por cobrança, faturamento, cálculo de impostos, prevenção a fraudes e emissão de recibos. Consulte a <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidade da Paddle</a>.</li>
        <li><strong>Autoridades públicas</strong> — quando exigido por lei, ordem judicial ou proteção de direitos.</li>
      </ul>

      <h2>6. Transferência internacional</h2>
      <p>
        Alguns operadores estão sediados fora do Brasil. Adotamos garantias adequadas (cláusulas contratuais,
        avaliação de país adequado) conforme art. 33 da LGPD.
      </p>

      <h2>7. Retenção</h2>
      <ul>
        <li>Dados de conta ativos: enquanto a conta existir.</li>
        <li>Histórico de petições, chats e diagnósticos: enquanto a conta existir, ou até você excluir.</li>
        <li>Registros financeiros e fiscais: por até 5 anos após a transação, conforme legislação.</li>
        <li>Logs de segurança: até 6 meses.</li>
        <li>Após o encerramento da conta, dados são apagados ou anonimizados, salvo obrigação legal de guarda.</li>
      </ul>

      <h2>8. Seus direitos como titular (LGPD art. 18)</h2>
      <p>Você tem direito a:</p>
      <ul>
        <li>Confirmar a existência de tratamento e acessar seus dados;</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>Anonimizar, bloquear ou eliminar dados desnecessários, excessivos ou tratados em desconformidade;</li>
        <li>Solicitar a portabilidade a outro fornecedor;</li>
        <li>Eliminar dados tratados com base em consentimento, respeitadas guardas legais;</li>
        <li>Obter informação sobre entidades com quem compartilhamos seus dados;</li>
        <li>Revogar o consentimento a qualquer momento;</li>
        <li>Peticionar perante a Autoridade Nacional de Proteção de Dados (<a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">ANPD</a>).</li>
      </ul>
      <p>
        Para exercer qualquer direito, escreva para <a href="mailto:contato@prezados.ai">contato@prezados.ai</a>.
        Responderemos em até 15 dias.
      </p>

      <h2>9. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais adequadas: criptografia em trânsito (TLS) e em repouso,
        controle de acesso baseado em <em>Row Level Security</em>, autenticação por credenciais próprias,
        segregação de ambientes e monitoramento de acesso.
      </p>

      <h2>10. Cookies</h2>
      <p>
        Utilizamos apenas cookies estritamente necessários à autenticação e ao funcionamento do Serviço.
        Não utilizamos cookies de rastreamento publicitário.
      </p>

      <h2>11. Alterações neste Aviso</h2>
      <p>
        Podemos atualizar este Aviso. Alterações materiais serão comunicadas com antecedência razoável.
        A data de última atualização está no topo do documento.
      </p>

      <h2>12. Encarregado (DPO) e contato</h2>
      <p>
        Encarregado de Proteção de Dados: <a href="mailto:contato@prezados.ai">contato@prezados.ai</a>.
      </p>
    </LegalPageLayout>
  );
}
