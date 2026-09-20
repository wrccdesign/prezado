// Conteúdo textual de cada rota pública, injetado no HTML gerado no build
// (plugin "static-route-meta" em vite.config.ts) para que robôs que não
// executam JavaScript — incluindo os das IAs de busca — leiam o conteúdo.
// Ao hidratar, o React substitui esse bloco pela aplicação real.
// TypeScript puro: sem React e sem APIs de browser, roda também em Node.

import {
  FaqItem,
  FAQ_CORRECAO_MONETARIA,
  FAQ_PLANOS,
  FAQ_PRAZO_PROCESSUAL,
} from "./faqData";

export type RouteContent = {
  /** Título principal em texto, equivalente ao H1 da página. */
  heading: string;
  /** Resposta direta, em um parágrafo, ao que a página resolve. */
  intro: string;
  /** Pontos principais, em frases completas. */
  bullets?: string[];
  /** Perguntas e respostas exibidas na página. */
  faq?: FaqItem[];
};

export const ROUTE_CONTENT: Record<string, RouteContent> = {
  "/": {
    heading: "Do caso à petição, com fonte",
    intro:
      "O Honorífico reúne calculadoras jurídicas gratuitas com índices oficiais do Banco Central, consulta processual nos dados do CNJ, modelos de minutas e recursos de IA para diagnóstico do caso, análise de documentos e geração de petições. Todo precedente citado vem do acervo consultável, com link para a fonte no tribunal; quando não há decisão localizada, a resposta diz isso.",
    bullets: [
      "Calculadoras ilimitadas e sem cadastro: correção monetária e juros, prazo processual, custas do TJSP, rescisão trabalhista, pensão alimentícia, operações com datas e validador de CPF/CNPJ.",
      "Memória de cálculo mês a mês, exportável em PDF e Word, pronta para anexar à petição.",
      "Índices das séries oficiais do Banco Central: IPCA, INPC, IGP-M, Selic e Taxa Legal, sincronizados diariamente, com a Lei 14.905/2024 aplicada.",
      "Consulta processual com dados públicos do CNJ e link para a fonte oficial.",
      "Cada diagnóstico e cada petição passam por verificação das citações contra o acervo, e o resultado é exibido.",
    ],
  },
  "/calculadoras": {
    heading: "Calculadoras jurídicas gratuitas",
    intro:
      "Sete calculadoras jurídicas gratuitas, ilimitadas e sem cadastro, cada uma com base legal citada e memória de cálculo exportável em PDF e Word.",
    bullets: [
      "Correção monetária e juros pela Lei 14.905/2024, com IPCA, INPC, IGP-M, Selic e Taxa Legal.",
      "Prazo processual em dias úteis ou corridos, com feriados forenses e recesso do art. 220 do CPC.",
      "Custas processuais do TJSP pela Lei estadual 11.608/2003, com a UFESP vigente.",
      "Rescisão trabalhista, incluindo o acordo do art. 484-A da CLT.",
      "Pensão alimentícia pelo binômio do art. 1.694 do Código Civil.",
      "Operações com datas e validador de CPF e CNPJ pelo módulo 11.",
    ],
  },
  "/calculadoras/correcao-monetaria-juros-lei-14905": {
    heading: "Calculadora de correção monetária e juros",
    intro:
      "Atualize um valor entre duas datas por IPCA, INPC, IGP-M, Selic ou Taxa Legal, com juros de mora conforme a Lei 14.905/2024. Desde 30/08/2024, sem índice convencionado, a correção é pelo IPCA e os juros correspondem à Selic menos o IPCA; se essa conta der negativo, os juros são zero (art. 406, §3º, do Código Civil).",
    bullets: [
      "Índices das séries do Banco Central: IPCA (433), INPC (188), IGP-M (189), Selic (4390) e Taxa Legal (29543), sincronizadas diariamente.",
      "Juros simples ou compostos, taxa fixa mensal ou sem juros, à escolha.",
      "Meses inicial e final calculados pró-rata, com opção de meses inteiros.",
      "Multa e honorários somados e discriminados no resultado.",
      "Memória mês a mês com índice, variação, fator acumulado, saldo corrigido e juros, exportável em PDF e Word.",
    ],
    faq: FAQ_CORRECAO_MONETARIA,
  },
  "/calculadoras/prazo-processual": {
    heading: "Calculadora de prazo processual",
    intro:
      "Conte prazos em dias úteis ou corridos a partir da disponibilização no DJe ou da publicação. A contagem segue o art. 219 do CPC, a regra de publicação do art. 224, §2º, e a suspensão de 20 de dezembro a 20 de janeiro do art. 220.",
    bullets: [
      "Feriados nacionais, estaduais e municipais descontados da contagem, com o motivo indicado em cada dia.",
      "Suspensões forenses cadastradas por tribunal, incluindo a Justiça Federal.",
      "Vencimento em dia não útil prorrogado para o próximo dia útil.",
      "Exportação em PDF e Word e arquivo .ics para lançar o vencimento na agenda.",
    ],
    faq: FAQ_PRAZO_PROCESSUAL,
  },
  "/calculadoras/custas-tjsp": {
    heading: "Calculadora de custas processuais do TJSP",
    intro:
      "Calcule a taxa judiciária do Tribunal de Justiça de São Paulo pela Lei estadual 11.608/2003: 1% na distribuição e 1% na fase recursal, com piso de 5 UFESPs e teto de 3.000 UFESPs, aplicando a UFESP vigente.",
    bullets: [
      "Valor por fase, com memória de cálculo detalhada.",
      "Tratamento das hipóteses de isenção e de justiça gratuita.",
      "Resultado exportável em PDF e Word.",
    ],
  },
  "/calculadoras/rescisao-trabalhista": {
    heading: "Calculadora de rescisão trabalhista",
    intro:
      "Estime as verbas rescisórias conforme a CLT: saldo de salário, aviso prévio, 13º proporcional, férias vencidas e proporcionais com o terço constitucional, FGTS do período e multa rescisória.",
    bullets: [
      "Dispensa sem justa causa, pedido de demissão, dispensa por justa causa e o acordo do art. 484-A da CLT.",
      "Aviso prévio proporcional, com os 3 dias por ano de serviço da Lei 12.506/2011.",
      "No acordo do art. 484-A, aviso e multa pela metade, saque de 80% do FGTS e sem seguro-desemprego.",
    ],
  },
  "/calculadoras/pensao-alimenticia": {
    heading: "Calculadora de pensão alimentícia",
    intro:
      "Estime uma faixa de pensão pelo binômio necessidade e possibilidade do art. 1.694, §1º, do Código Civil, considerando renda do alimentante, número de filhos, despesas fixas e padrão de vida. É uma referência, não um valor vinculante: a fixação depende do juiz e da prova do caso.",
  },
  "/calculadoras/operacoes-datas": {
    heading: "Operações com datas",
    intro:
      "Some ou subtraia dias úteis e corridos, calcule a diferença entre duas datas e verifique se uma data cai em dia útil. Útil para prazos contratuais e controle interno do escritório.",
  },
  "/calculadoras/validador-cpf-cnpj": {
    heading: "Validador de CPF e CNPJ",
    intro:
      "Confira os dígitos verificadores de CPF e CNPJ pelo algoritmo de módulo 11. O número é processado no próprio navegador, sem envio a servidor e sem consulta à Receita Federal. O dígito válido não significa que o número esteja ativo.",
  },
  "/diagnostico": {
    heading: "Diagnóstico jurídico do caso",
    intro:
      "Descreva o caso em linguagem comum e receba uma análise estruturada: direito envolvido, próximos passos, custos estimados, onde entrar e nível de urgência. A linguagem se adapta ao perfil, técnica para advogado e simples para quem não é da área.",
    bullets: [
      "Precedentes citados apenas quando localizados no acervo, com link para a fonte.",
      "As citações da resposta são conferidas contra o acervo e o resultado da conferência é exibido.",
      "Resultado exportável em PDF e Word. Requer conta.",
      "A análise é informativa e não substitui a orientação de um advogado no caso concreto.",
    ],
  },
  "/jurisprudencia": {
    heading: "Consulta processual e jurisprudência",
    intro:
      "Consulte processos e andamentos nos dados públicos do CNJ, com número no padrão CNJ, tribunal, órgão julgador, classe, assuntos e movimentações, e link para a fonte no tribunal.",
    bullets: [
      "Acervo de ementas em expansão, com resumo por IA identificado como tal.",
      "Sem conta, são permitidas 3 buscas por dia.",
      "Nenhum número de processo ou precedente é gerado por IA: o que aparece vem do acervo consultável.",
    ],
  },
  "/modelos-de-minutas": {
    heading: "Modelos de minutas jurídicas",
    intro:
      "Nove minutas editáveis e gratuitas, cada uma com base legal citada e checklist de conferência antes do protocolo.",
    bullets: [
      "Petição inicial de cobrança, art. 319 do CPC.",
      "Contestação cível, arts. 335 a 342 do CPC.",
      "Reclamação trabalhista com pedidos líquidos, art. 840, §1º, da CLT.",
      "Recurso de apelação, arts. 1.009 a 1.014 do CPC.",
      "Notificação extrajudicial, procuração ad judicia do art. 105 do CPC, contrato de honorários e acordo extrajudicial com homologação.",
    ],
  },
  "/modelos-de-minutas/peticao-inicial-cobranca": {
    heading: "Modelo de petição inicial de cobrança",
    intro:
      "Minuta editável de petição inicial de cobrança pelo procedimento comum, com os requisitos do art. 319 do CPC: qualificação, fatos, fundamentação jurídica, pedidos, valor da causa e requerimento de provas.",
  },
  "/modelos-de-minutas/contestacao-civel": {
    heading: "Modelo de contestação cível",
    intro:
      "Minuta editável de contestação cível conforme os arts. 335 a 342 do CPC, com preliminares, alegação de prescrição, impugnação específica dos fatos, pedidos finais e checklist.",
  },
  "/modelos-de-minutas/reclamacao-trabalhista": {
    heading: "Modelo de reclamação trabalhista",
    intro:
      "Minuta editável de reclamação trabalhista com pedidos líquidos, como exige o art. 840, §1º, da CLT, cobrindo verbas rescisórias, horas extras e requerimentos processuais. O texto vem com os campos entre colchetes para preenchimento e com a estrutura na ordem em que a Vara do Trabalho espera ler a peça.",
    bullets: [
      "Endereçamento à Vara do Trabalho competente pelo local da prestação de serviços, art. 651 da CLT.",
      "Qualificação das partes com CTPS, função, salário, data de admissão e de saída.",
      "Narrativa dos fatos separada por tema: contrato, jornada, verbas não pagas e rescisão.",
      "Pedidos líquidos com o valor de cada verba, exigência do art. 840, §1º, da CLT desde a Reforma Trabalhista.",
      "Requerimentos processuais: justiça gratuita, honorários de sucumbência, provas e valor da causa.",
      "Checklist de conferência antes do protocolo e exportação em PDF e Word.",
    ],
    faq: [
      {
        question: "O que muda com a exigência de pedido líquido?",
        answer:
          "Desde a Lei 13.467/2017, o art. 840, §1º, da CLT exige pedido certo, determinado e com indicação de valor. Pedido sem valor pode ser extinto sem resolução de mérito. O modelo já traz a coluna de valores por verba; a calculadora de rescisão trabalhista do Honorífico gera esses números com memória de cálculo.",
      },
      {
        question: "Onde protocolar a reclamação?",
        answer:
          "Em regra, na Vara do Trabalho do local da prestação de serviços, conforme o art. 651 da CLT, mesmo que a contratação tenha ocorrido em outra cidade. Há exceções para agente ou viajante comercial e para empregador que promova atividade fora do lugar do contrato.",
      },
      {
        question: "Preciso atualizar os valores dos pedidos?",
        answer:
          "Sim. As verbas devem estar atualizadas até a data da distribuição, com correção e juros. A calculadora de correção monetária e juros aplica a Lei 14.905/2024 e entrega a memória mês a mês para anexar à petição.",
      },
      {
        question: "O modelo serve para qualquer caso?",
        answer:
          "É um ponto de partida. A peça precisa ser ajustada aos fatos, à prova disponível e à jurisprudência do tribunal, e revisada por advogado habilitado antes do protocolo.",
      },
    ],
  },
  "/modelos-de-minutas/notificacao-extrajudicial": {
    heading: "Modelo de notificação extrajudicial",
    intro:
      "Minuta editável de notificação extrajudicial para constituição em mora, com prazo para cumprimento, advertência sobre as medidas judiciais cabíveis e checklist de envio com comprovação. Serve para cobrança, rescisão contratual, exigência de obrigação de fazer e interrupção de discussões antes do ajuizamento.",
    bullets: [
      "Identificação do notificante e do notificado, com CPF ou CNPJ e endereço completo.",
      "Descrição objetiva da obrigação descumprida, com data, valor e documento que a comprova.",
      "Prazo para cumprimento, em regra de 5 a 15 dias, contado do recebimento.",
      "Constituição em mora nos termos dos arts. 394 e 397 do Código Civil.",
      "Advertência sobre as medidas judiciais cabíveis em caso de silêncio.",
      "Formas de envio com prova de recebimento: cartório de títulos e documentos, carta com aviso de recebimento ou e-mail com confirmação.",
    ],
    faq: [
      {
        question: "A notificação extrajudicial é obrigatória antes de processar?",
        answer:
          "Na maioria dos casos não, mas ela constitui o devedor em mora quando a obrigação não tem data certa, art. 397, parágrafo único, do Código Civil, e serve como prova da tentativa de solução antes do processo. Em alguns contratos, como alienação fiduciária e locação, a notificação prévia é exigida.",
      },
      {
        question: "Qual a diferença entre notificação extrajudicial e protesto?",
        answer:
          "A notificação comunica e concede prazo. O protesto, feito em cartório, registra publicamente a inadimplência e afeta o crédito do devedor. Os dois podem ser usados, em sequência.",
      },
      {
        question: "Como comprovar que o notificado recebeu?",
        answer:
          "Pelo cartório de títulos e documentos, que certifica a entrega, por carta registrada com aviso de recebimento ou por e-mail com confirmação de leitura, guardando o comprovante para instruir eventual ação.",
      },
      {
        question: "Preciso de advogado para notificar?",
        answer:
          "A notificação pode ser enviada pela própria parte, mas a redação por advogado reduz o risco de descrever mal a obrigação, de fixar prazo inadequado ou de gerar prova contra o próprio notificante.",
      },
    ],
  },
  "/modelos-de-minutas/procuracao-ad-judicia": {
    heading: "Modelo de procuração ad judicia",
    intro:
      "Minuta editável de procuração ad judicia et extra com os poderes especiais do art. 105 do CPC, para representação judicial e extrajudicial do cliente. Inclui os poderes da cláusula geral, os poderes especiais que precisam de menção expressa e os campos de qualificação do outorgante e do outorgado.",
    bullets: [
      "Poderes gerais da cláusula ad judicia: postular em juízo, requerer, recorrer e acompanhar o processo até o fim.",
      "Poderes especiais do art. 105 do CPC, que exigem menção expressa: receber citação, confessar, reconhecer a procedência do pedido, transigir, desistir, renunciar ao direito, receber, dar quitação, firmar compromisso e assinar declaração de hipossuficiência.",
      "Cláusula ad extra para representação fora do processo, em órgãos públicos e entidades privadas.",
      "Prazo de validade e possibilidade de substabelecimento, com ou sem reserva de poderes.",
      "Qualificação completa do outorgante, do outorgado e da sociedade de advogados, quando houver.",
      "Versão para pessoa física e para pessoa jurídica, exportável em PDF e Word.",
    ],
    faq: [
      {
        question: "O que significa ad judicia et extra?",
        answer:
          "Ad judicia são os poderes para atuar dentro do processo. Et extra estende a representação para fora dele, como protocolos em órgãos públicos, cartórios, bancos e concessionárias.",
      },
      {
        question: "Quais poderes precisam constar expressamente?",
        answer:
          "Os do art. 105 do CPC: receber citação, confessar, reconhecer a procedência do pedido, transigir, desistir, renunciar ao direito sobre o qual se funda a ação, receber, dar quitação, firmar compromisso e assinar declaração de hipossuficiência. Sem menção expressa, o advogado não pode praticá-los.",
      },
      {
        question: "A procuração precisa de reconhecimento de firma?",
        answer:
          "Em regra não. O art. 105 do CPC dispensa o reconhecimento de firma na procuração para o foro em geral. Exigências específicas podem aparecer em atos notariais e em alguns órgãos administrativos.",
      },
      {
        question: "Procuração eletrônica tem a mesma validade?",
        answer:
          "Sim, quando assinada com certificado digital ICP-Brasil ou por plataforma de assinatura eletrônica aceita pelo tribunal, conforme o art. 105, §1º, do CPC e as normas do processo eletrônico.",
      },
    ],
  },
  "/modelos-de-minutas/recurso-apelacao": {
    heading: "Modelo de recurso de apelação",
    intro:
      "Minuta editável de apelação conforme os arts. 1.009 a 1.014 do CPC: petição de interposição, razões recursais, preliminares e pedido de reforma da sentença.",
  },
  "/modelos-de-minutas/contrato-prestacao-servicos-advocaticios": {
    heading: "Modelo de contrato de honorários advocatícios",
    intro:
      "Minuta editável de contrato de honorários: objeto, honorários fixos e de êxito, reembolso de despesas, hipóteses de rescisão e foro eleito.",
  },
  "/modelos-de-minutas/acordo-extrajudicial-homologacao": {
    heading: "Modelo de acordo extrajudicial com homologação",
    intro:
      "Minuta editável de acordo extrajudicial acompanhada de petição conjunta de homologação judicial, com base nos arts. 515, III, e 725, VIII, do CPC.",
  },
  "/comparativo": {
    heading: "Comparativo de ferramentas jurídicas",
    intro:
      "A IA escreve, nós conferimos. Comparativo entre o Honorífico, assistentes de IA generalistas, portais de jurisprudência e sistemas de gestão, considerando de onde vem o precedente, se há link para a fonte oficial, se o cálculo usa série do Banco Central e se o resultado sai em PDF e Word.",
    bullets: [
      "Origem do precedente: acervo consultável com link para o tribunal, em vez de texto gerado.",
      "Verificação das citações depois de gerar a peça, com o resultado exibido ao usuário.",
      "Cálculo com índices oficiais e memória mês a mês anexável à petição.",
    ],
  },
  "/planos": {
    heading: "Planos e preços",
    intro:
      "Três planos, com cotas mensais renovadas no primeiro dia de cada mês. As calculadoras são ilimitadas em todos eles, inclusive sem conta; a assinatura libera os recursos de IA, o histórico salvo e o volume de consulta processual.",
    bullets: [
      "Gratuito: 20 consultas processuais, 10 mensagens no chat, 1 diagnóstico, 3 análises de documentos e 5 leituras com OCR por mês.",
      "Profissional: R$ 49 por mês, ou R$ 409 por ano à vista, equivalente a R$ 34,08 por mês, sem renovação automática no anual.",
      "Escritório: R$ 149 por mês.",
      "Sete dias de teste no Profissional, sem cartão. Cobrança em reais e cancelamento a qualquer momento.",
      "Garantia de reembolso de 30 dias, além do arrependimento de 7 dias do art. 49 do CDC.",
    ],
    faq: FAQ_PLANOS,
  },
  "/mapa-do-site": {
    heading: "Mapa do site",
    intro:
      "Todas as páginas públicas do Honorífico reunidas: calculadoras, consulta processual, modelos de minutas, comparativo, planos e documentos legais.",
  },
  "/termos": {
    heading: "Termos e condições de uso",
    intro:
      "Condições de uso do Honorífico: contratação e planos, cotas de uso, responsabilidades das partes, propriedade intelectual e encerramento da conta. A plataforma é fornecida pela entidade Honorífico e a cobrança é feita em reais.",
  },
  "/reembolso": {
    heading: "Política de reembolso",
    intro:
      "Reembolso integral em até 30 dias da compra ou renovação, sem necessidade de justificar, além do direito de arrependimento de 7 dias do art. 49 do CDC. O pedido é feito por e-mail e o valor volta pelo mesmo meio de pagamento.",
  },
  "/privacidade": {
    heading: "Aviso de privacidade",
    intro:
      "Como o Honorífico trata dados pessoais: base legal conforme a LGPD, finalidades de uso, compartilhamento com operadores, prazo de retenção e direitos do titular, incluindo acesso, correção e exclusão.",
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML de pré-renderização da rota. Fica dentro de #root e é substituído
 * pelo React na hidratação; serve apenas a quem não executa JavaScript.
 */
export function renderRouteContent(path: string): string | null {
  const content = ROUTE_CONTENT[path];
  if (!content) return null;

  const parts: string[] = [
    `<h1>${escapeHtml(content.heading)}</h1>`,
    `<p>${escapeHtml(content.intro)}</p>`,
  ];

  if (content.bullets?.length) {
    parts.push(
      `<ul>${content.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`,
    );
  }

  if (content.faq?.length) {
    parts.push("<h2>Perguntas frequentes</h2>");
    for (const item of content.faq) {
      parts.push(
        `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`,
      );
    }
  }

  parts.push(
    '<p><a href="/">Honorífico</a>, plataforma jurídica brasileira. <a href="/calculadoras">Calculadoras</a>, <a href="/jurisprudencia">consulta processual</a>, <a href="/modelos-de-minutas">modelos de minutas</a>, <a href="/planos">planos</a>.</p>',
  );

  return `<div data-static-content>${parts.join("")}</div>`;
}
