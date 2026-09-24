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
import { RESCISAO_SITUACOES, rescisaoPath } from "./rescisaoSituacoes";
import { CORRECAO_INDICES, correcaoPath } from "./correcaoIndices";

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
      "Calcule a taxa judiciária do Tribunal de Justiça de São Paulo pela Lei estadual 11.608/2003: 1% na distribuição e 1% na fase recursal, com piso de 5 UFESPs e teto de 3.000 UFESPs, aplicando a UFESP vigente. O resultado vem com memória de cálculo, indicando base, alíquota, piso e teto aplicados.",
    bullets: [
      "Base de cálculo: valor da causa atualizado, art. 4º da Lei 11.608/2003.",
      "1% na distribuição da inicial e 1% na interposição do recurso, cada parcela com piso e teto próprios.",
      "Piso de 5 UFESPs e teto de 3.000 UFESPs por parcela, convertidos pela UFESP do exercício.",
      "Hipóteses de isenção e de justiça gratuita tratadas separadamente do cálculo.",
      "Memória de cálculo exportável em PDF e Word, pronta para instruir a guia.",
    ],
    faq: [
      {
        question: "Como a taxa judiciária do TJSP é calculada?",
        answer:
          "Sobre o valor da causa atualizado, na alíquota de 1% no momento da distribuição e 1% na fase recursal, conforme os arts. 4º e 5º da Lei estadual 11.608/2003, observados o mínimo de 5 UFESPs e o máximo de 3.000 UFESPs em cada parcela.",
      },
      {
        question: "O que é a UFESP e onde encontro o valor vigente?",
        answer:
          "É a Unidade Fiscal do Estado de São Paulo, reajustada anualmente pela Secretaria da Fazenda estadual e publicada em portaria no fim de cada ano. A calculadora aplica a UFESP do exercício e mostra o valor usado no resultado.",
      },
      {
        question: "Quem é isento das custas?",
        answer:
          "Entre outros, o beneficiário da justiça gratuita, art. 98 do CPC, a Fazenda Pública nas hipóteses legais, o Ministério Público e os processos nos Juizados Especiais em primeiro grau, art. 54 da Lei 9.099/1995. A isenção não alcança despesas de terceiros, como perito e diligência de oficial.",
      },
      {
        question: "O que acontece se o recurso for protocolado sem preparo?",
        answer:
          "A consequência é a deserção, art. 1.007 do CPC, com possibilidade de recolhimento em dobro quando houver insuficiência e intimação para complementação, nas hipóteses previstas nos parágrafos do mesmo artigo.",
      },
      {
        question: "A calculadora cobre despesas além da taxa judiciária?",
        answer:
          "Não. Ela calcula a taxa da Lei 11.608/2003. Porte de remessa, diligência de oficial de justiça, honorários periciais e emolumentos de cartório são cobrados à parte, conforme as tabelas próprias.",
      },
    ],
  },
  "/calculadoras/rescisao-trabalhista": {
    heading: "Calculadora de rescisão trabalhista",
    intro:
      "Estime as verbas rescisórias conforme a CLT: saldo de salário, aviso prévio, 13º proporcional, férias vencidas e proporcionais com o terço constitucional, FGTS do período e multa rescisória. Escolha a modalidade de saída e a calculadora aplica as regras próprias de cada uma, com memória de cálculo por verba.",
    bullets: [
      "Dispensa sem justa causa, pedido de demissão, dispensa por justa causa e o acordo do art. 484-A da CLT.",
      "Aviso prévio proporcional, com os 3 dias por ano de serviço da Lei 12.506/2011, limitado a 90 dias.",
      "13º salário proporcional por avos, contando como mês inteiro a fração igual ou superior a 15 dias.",
      "Férias vencidas e proporcionais com o terço do art. 7º, XVII, da Constituição.",
      "FGTS de 8% sobre a remuneração e multa rescisória de 40% sobre o saldo, art. 18 da Lei 8.036/1990.",
      "No acordo do art. 484-A, aviso e multa pela metade, saque de 80% do FGTS e sem seguro-desemprego.",
    ],
    faq: [
      {
        question: "Qual o prazo para o pagamento das verbas rescisórias?",
        answer:
          "Dez dias corridos contados do término do contrato, art. 477, §6º, da CLT. O atraso gera multa equivalente a um salário do empregado, §8º do mesmo artigo, salvo quando a mora for causada pelo próprio trabalhador.",
      },
      {
        question: "Como funciona o acordo do art. 484-A da CLT?",
        answer:
          "É a rescisão por comum acordo: aviso prévio indenizado e multa do FGTS pela metade, saque de até 80% do saldo do FGTS e ausência de direito ao seguro-desemprego. As demais verbas são pagas integralmente.",
      },
      {
        question: "O que muda na dispensa por justa causa?",
        answer:
          "São devidos saldo de salário e férias vencidas com o terço. Não há aviso prévio, 13º proporcional, férias proporcionais, multa do FGTS nem saque do fundo, salvo entendimento diverso no caso concreto.",
      },
      {
        question: "As horas extras habituais entram na base de cálculo?",
        answer:
          "Sim. A média das horas extras, dos adicionais de insalubridade, periculosidade e noturno e das comissões integra a remuneração para cálculo de aviso, 13º, férias e FGTS, conforme as Súmulas 45, 347 e 376 do TST.",
      },
      {
        question: "O resultado serve para instruir uma reclamação trabalhista?",
        answer:
          "Serve como base. O art. 840, §1º, da CLT exige pedido com indicação de valor, e a memória de cálculo exportada em PDF ou Word pode acompanhar a petição, junto do modelo de reclamação trabalhista disponível no site.",
      },
    ],
  },
  "/calculadoras/pensao-alimenticia": {
    heading: "Calculadora de pensão alimentícia",
    intro:
      "Estime uma faixa de pensão pelo binômio necessidade e possibilidade do art. 1.694, §1º, do Código Civil, considerando renda do alimentante, número de filhos, despesas fixas e padrão de vida. É uma referência para negociação, não um valor vinculante: a fixação depende do juiz e da prova produzida no caso.",
    bullets: [
      "Binômio do art. 1.694, §1º, do Código Civil: necessidade de quem recebe e possibilidade de quem paga.",
      "Faixa de referência, com percentual sobre renda líquida e valor mensal estimado.",
      "Ajuste pelo número de filhos, por despesas fixas do alimentante e por outras obrigações alimentares.",
      "Distinção entre percentual sobre o rendimento e valor fixo em salários mínimos.",
      "Resultado exportável em PDF e Word para instruir acordo ou petição.",
    ],
    faq: [
      {
        question: "Existe percentual fixo de pensão em lei?",
        answer:
          "Não. A lei não fixa percentual. A prática forense costuma girar em torno de 20% a 30% da renda líquida para um filho, mas o valor depende da necessidade comprovada e da capacidade do alimentante, art. 1.694, §1º, do Código Civil.",
      },
      {
        question: "A pensão incide sobre o salário bruto ou líquido?",
        answer:
          "Em regra sobre a remuneração líquida, descontados apenas os encargos obrigatórios, como imposto de renda e contribuição previdenciária. Descontos voluntários, como empréstimo consignado e plano de saúde opcional, não reduzem a base.",
      },
      {
        question: "Décimo terceiro e férias entram na conta?",
        answer:
          "Quando a pensão é fixada em percentual sobre a remuneração, a jurisprudência do STJ admite a incidência sobre 13º salário e terço de férias, salvo disposição diferente na decisão ou no acordo.",
      },
      {
        question: "Quem não tem vínculo formal também paga?",
        answer:
          "Sim. Na ausência de renda comprovada, a fixação costuma ocorrer em salários mínimos, com base em sinais exteriores de riqueza e no padrão de vida demonstrado nos autos.",
      },
      {
        question: "Como pedir revisão do valor?",
        answer:
          "Por ação revisional, art. 1.699 do Código Civil, sempre que houver mudança na necessidade de quem recebe ou na possibilidade de quem paga. O acordo entre as partes também pode ser levado à homologação judicial.",
      },
    ],
  },
  "/calculadoras/operacoes-datas": {
    heading: "Operações com datas",
    intro:
      "Some ou subtraia dias úteis e corridos, calcule a diferença entre duas datas e verifique se uma data cai em dia útil. Útil para prazos contratuais, contagem de prescrição e controle interno do escritório, com feriados nacionais já considerados na contagem em dias úteis.",
    bullets: [
      "Soma e subtração de dias corridos ou úteis a partir de uma data base.",
      "Diferença entre duas datas em dias, meses e anos.",
      "Verificação de dia útil, com indicação do feriado quando houver.",
      "Feriados nacionais aplicados automaticamente na contagem em dias úteis.",
      "Resultado exportável em PDF e Word.",
    ],
    faq: [
      {
        question: "Quando o prazo conta em dias úteis e quando conta em dias corridos?",
        answer:
          "Prazo processual civil conta em dias úteis, art. 219 do CPC. Prazo material, como prescrição, decadência e obrigação contratual, conta em dias corridos, art. 132 do Código Civil. Prazo trabalhista processual também é contado em dias úteis, art. 775 da CLT.",
      },
      {
        question: "O dia inicial entra na contagem?",
        answer:
          "Não. Exclui-se o dia do começo e inclui-se o do vencimento, art. 132 do Código Civil e art. 224 do CPC. Vencendo em dia não útil, prorroga-se para o primeiro dia útil seguinte.",
      },
      {
        question: "Esta calculadora serve para prazo processual?",
        answer:
          "Para prazo judicial, use a calculadora de prazo processual: ela aplica a regra de publicação no DJe, os feriados forenses locais e a suspensão de 20 de dezembro a 20 de janeiro do art. 220 do CPC.",
      },
      {
        question: "Quais feriados são considerados?",
        answer:
          "Os feriados nacionais, incluindo os móveis, calculados a partir da Páscoa. Feriados estaduais, municipais e suspensões de tribunal ficam na calculadora de prazo processual, que tem o cadastro por tribunal.",
      },
    ],
  },
  "/calculadoras/validador-cpf-cnpj": {
    heading: "Validador de CPF e CNPJ",
    intro:
      "Confira os dígitos verificadores de CPF e CNPJ pelo algoritmo de módulo 11. O número é processado no próprio navegador, sem envio a servidor e sem consulta à Receita Federal. O dígito válido indica apenas que o número é bem formado; não significa que ele exista ou esteja ativo.",
    bullets: [
      "Validação de CPF pelos dois dígitos verificadores, com pesos de 10 a 2 e de 11 a 2.",
      "Validação de CNPJ pelos pesos cíclicos de 2 a 9, no formato de 14 dígitos.",
      "Rejeição de sequências repetidas, como 111.111.111-11, que passam na conta mas são inválidas.",
      "Processamento local, sem envio do número e sem armazenamento.",
      "Formatação automática com pontos, barra e traço para copiar na qualificação da peça.",
    ],
    faq: [
      {
        question: "O validador consulta a situação cadastral na Receita Federal?",
        answer:
          "Não. A conferência é apenas matemática, pelos dígitos verificadores. Situação cadastral, nome do titular e endereço só podem ser obtidos nos canais oficiais da Receita Federal.",
      },
      {
        question: "Como funciona o cálculo do dígito verificador?",
        answer:
          "Pelo módulo 11: cada algarismo é multiplicado por um peso, os produtos são somados e o resto da divisão da soma por 11 define o dígito, sendo zero quando o resto é 0 ou 1. O segundo dígito repete a conta incluindo o primeiro.",
      },
      {
        question: "Por que 111.111.111-11 é recusado?",
        answer:
          "Porque sequências com todos os algarismos iguais satisfazem a conta do módulo 11, mas nunca foram atribuídas. O validador as rejeita expressamente, como fazem os sistemas oficiais.",
      },
      {
        question: "O número digitado fica gravado?",
        answer:
          "Não. A validação ocorre no próprio navegador, sem envio ao servidor e sem registro, o que atende ao princípio da minimização de dados da LGPD.",
      },
      {
        question: "Existe o novo CNPJ alfanumérico?",
        answer:
          "A Receita Federal definiu o formato alfanumérico para novas inscrições a partir de 2026, mantendo o dígito verificador por módulo 11 sobre os valores das letras. O validador trata hoje o formato numérico de 14 dígitos.",
      },
    ],
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
      "Minuta editável de petição inicial de cobrança pelo procedimento comum, com os requisitos do art. 319 do CPC: endereçamento, qualificação das partes, fatos, fundamentação jurídica, pedidos, valor da causa e requerimento de provas. Serve para dívida líquida sem título executivo, para título prescrito para execução e para prestação de serviço não paga.",
    bullets: [
      "Requisitos do art. 319 do CPC conferidos um a um, para evitar emenda da inicial.",
      "Valor da causa correspondente ao proveito econômico pretendido, art. 292, I e II, do CPC.",
      "Pedido de correção monetária e juros desde o vencimento, com a Lei 14.905/2024 aplicada.",
      "Requerimento de citação, de produção de provas e de honorários de sucumbência.",
      "Campos entre colchetes para preenchimento e checklist de conferência antes do protocolo.",
      "Exportação em PDF e Word.",
    ],
    faq: [
      {
        question: "Quando usar cobrança em vez de execução ou monitória?",
        answer:
          "A execução exige título executivo, judicial ou extrajudicial. A monitória cabe quando há prova escrita sem eficácia de título, art. 700 do CPC. A ação de cobrança pelo procedimento comum é o caminho quando não há título nem prova escrita suficiente, ou quando a pretensão executiva já prescreveu.",
      },
      {
        question: "Desde quando correm juros e correção?",
        answer:
          "Em obrigação com data certa, a mora é automática desde o vencimento, art. 397 do Código Civil. Sem data certa, a mora começa com a notificação ou a citação. A calculadora de correção monetária e juros do Honorífico gera a memória de cálculo mês a mês para anexar à inicial.",
      },
      {
        question: "Como definir o valor da causa?",
        answer:
          "Pelo valor do débito atualizado até a data da distribuição, somando principal, correção, juros e, quando cabível, multa contratual. Valor subestimado pode gerar impugnação e recolhimento complementar de custas.",
      },
      {
        question: "Quais documentos instruem a inicial?",
        answer:
          "Contrato ou proposta aceita, notas fiscais, comprovantes de entrega ou de prestação do serviço, planilha do débito, notificação extrajudicial enviada e comprovante de recebimento, e procuração.",
      },
      {
        question: "Preciso tentar acordo antes?",
        answer:
          "Não é condição da ação, mas a notificação extrajudicial prévia constitui em mora e demonstra boa-fé. A audiência de conciliação do art. 334 do CPC é designada de ofício, salvo desinteresse expresso das duas partes.",
      },
    ],
  },
  "/modelos-de-minutas/contestacao-civel": {
    heading: "Modelo de contestação cível",
    intro:
      "Minuta editável de contestação cível conforme os arts. 335 a 342 do CPC, com preliminares do art. 337, alegação de prescrição e decadência, impugnação específica dos fatos, pedido contraposto quando cabível, pedidos finais e checklist. A estrutura segue a ordem em que o juiz lê a peça: preliminares, prejudiciais de mérito e mérito.",
    bullets: [
      "Prazo de 15 dias úteis, contado conforme o art. 335 do CPC, com o marco variando entre audiência de conciliação, protocolo do pedido de cancelamento e juntada do aviso de recebimento.",
      "Preliminares do art. 337: incompetência, inépcia da inicial, ilegitimidade, falta de interesse, litispendência, coisa julgada e conexão.",
      "Prejudiciais de mérito: prescrição e decadência, que devem vir antes da defesa de fundo.",
      "Impugnação específica de cada fato, sob pena de presunção de veracidade, art. 341 do CPC.",
      "Requerimento de provas, de honorários de sucumbência e, quando cabível, de justiça gratuita.",
      "Checklist de conferência e exportação em PDF e Word.",
    ],
    faq: [
      {
        question: "De quando começa a correr o prazo de contestação?",
        answer:
          "Do art. 335 do CPC: da audiência de conciliação frustrada, do protocolo do pedido de cancelamento da audiência pelo réu quando as duas partes manifestam desinteresse, ou da juntada do mandado ou do aviso de recebimento nos demais casos. São 15 dias úteis, art. 219 do CPC.",
      },
      {
        question: "O que acontece se algum fato não for impugnado?",
        answer:
          "O art. 341 do CPC presume verdadeiros os fatos não impugnados especificamente, salvo nas exceções do próprio artigo. Por isso a defesa deve percorrer cada fato narrado na inicial, não apenas negar em bloco.",
      },
      {
        question: "Toda matéria precisa vir na contestação?",
        answer:
          "Sim, pelo princípio da eventualidade do art. 336 do CPC: toda a defesa deve ser deduzida de uma vez. Depois, só podem ser alegadas matérias de ordem pública, fato superveniente ou aquelas que a lei permite conhecer de ofício.",
      },
      {
        question: "Dá para pedir algo contra o autor na própria contestação?",
        answer:
          "Sim, nos procedimentos que admitem pedido contraposto, como o dos Juizados Especiais. No procedimento comum, a pretensão do réu contra o autor é deduzida por reconvenção, na mesma peça, art. 343 do CPC.",
      },
      {
        question: "Como calcular a prescrição alegada?",
        answer:
          "Identifique o termo inicial, aplique o prazo do art. 205 ou 206 do Código Civil e verifique causas de interrupção e suspensão. A calculadora de operações com datas ajuda a contar o intervalo exato entre o termo inicial e a distribuição.",
      },
    ],
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
      "Minuta editável de apelação conforme os arts. 1.009 a 1.014 do CPC, em duas partes: petição de interposição dirigida ao juízo de primeiro grau e razões recursais dirigidas ao tribunal, com preliminares, impugnação específica dos fundamentos da sentença e pedido de reforma ou anulação.",
    bullets: [
      "Prazo de 15 dias úteis da publicação da sentença, art. 1.003, §5º, do CPC, em dobro para a Fazenda Pública, o Ministério Público e a Defensoria.",
      "Petição de interposição com comprovante de preparo, sob pena de deserção, art. 1.007 do CPC.",
      "Razões com impugnação específica de cada fundamento da sentença, art. 1.010, II, do CPC.",
      "Preliminares e questões resolvidas por decisão interlocutória não agravável, art. 1.009, §1º.",
      "Pedido de efeito suspensivo ou de antecipação da tutela recursal quando houver risco de dano.",
      "Checklist de conferência antes do protocolo e exportação em PDF e Word.",
    ],
    faq: [
      {
        question: "O que precisa constar nas razões de apelação?",
        answer:
          "Os nomes e a qualificação das partes, a exposição do fato e do direito, as razões do pedido de reforma ou de decretação de nulidade e o próprio pedido de nova decisão, conforme o art. 1.010 do CPC. A jurisprudência exige impugnação específica dos fundamentos da sentença; razão genérica leva ao não conhecimento.",
      },
      {
        question: "Como se calcula o preparo?",
        answer:
          "Pelas custas do tribunal respectivo. No TJSP, é a taxa judiciária da fase recursal da Lei estadual 11.608/2003, calculada na calculadora de custas do Honorífico, com piso e teto em UFESP. O comprovante acompanha a interposição, salvo justiça gratuita ou dispensa legal.",
      },
      {
        question: "A apelação tem efeito suspensivo?",
        answer:
          "Em regra sim, art. 1.012 do CPC. As exceções do §1º, como sentença que homologa divisão, condena a pagar alimentos ou confirma tutela provisória, produzem efeitos desde logo, cabendo pedido de efeito suspensivo ao relator.",
      },
      {
        question: "Posso apresentar documento novo em grau de recurso?",
        answer:
          "Somente quando o documento não estava disponível antes ou se refere a fato ocorrido depois, art. 435 do CPC, com demonstração do motivo. Fora disso, a juntada tende a ser indeferida.",
      },
      {
        question: "Como contar o prazo com feriados e suspensões?",
        answer:
          "Em dias úteis, art. 219 do CPC, descontando feriados forenses e o recesso de 20 de dezembro a 20 de janeiro do art. 220. A calculadora de prazo processual faz a contagem a partir da disponibilização no DJe e indica o motivo de cada dia excluído.",
      },
    ],
  },
  "/modelos-de-minutas/contrato-prestacao-servicos-advocaticios": {
    heading: "Modelo de contrato de honorários advocatícios",
    intro:
      "Minuta editável de contrato de prestação de serviços advocatícios com objeto delimitado, honorários fixos e de êxito, forma de pagamento, reembolso de despesas, hipóteses de rescisão e foro eleito. A redação segue o Código de Ética e Disciplina da OAB e o art. 22 do Estatuto da Advocacia, Lei 8.906/1994.",
    bullets: [
      "Objeto delimitado: processo, instância e atos abrangidos, para evitar discussão sobre o que estava contratado.",
      "Honorários contratuais fixos, por ato ou por êxito, com percentual e base de cálculo explícitos.",
      "Distinção entre honorários contratuais e de sucumbência, que pertencem ao advogado, art. 23 da Lei 8.906/1994.",
      "Reembolso de custas, diligências e deslocamentos, com forma de comprovação.",
      "Reajuste, mora, hipóteses de rescisão e critério de pagamento proporcional ao trabalho já realizado.",
      "Versões para pessoa física e jurídica, exportáveis em PDF e Word.",
    ],
    faq: [
      {
        question: "Honorário de êxito tem limite?",
        answer:
          "Não há percentual fixado em lei, mas o Código de Ética e Disciplina veda valores aviltantes e exige proporcionalidade com o trabalho e o proveito econômico. Em causas de família e nas que envolvem verba alimentar, a tabela da seccional e a moderação são referências obrigatórias.",
      },
      {
        question: "Honorários de sucumbência entram no acerto com o cliente?",
        answer:
          "Não. O art. 23 da Lei 8.906/1994 define que pertencem ao advogado, sendo distintos do contratado. O contrato deve dizer isso de forma expressa para evitar compensação indevida.",
      },
      {
        question: "O que acontece se o cliente revogar o mandato no meio do processo?",
        answer:
          "São devidos os honorários proporcionais ao trabalho já realizado, além do reembolso das despesas. A cláusula de rescisão deve prever o critério de apuração, por fase processual ou por percentual do contratado.",
      },
      {
        question: "O contrato serve como título executivo?",
        answer:
          "Sim, quando assinado pelo cliente e por duas testemunhas, como título executivo extrajudicial, art. 784, III, do CPC, o que permite execução direta do valor inadimplido.",
      },
      {
        question: "Como corrigir valores atrasados?",
        answer:
          "Pelo índice previsto no contrato e, na ausência, pela regra do art. 406 do Código Civil com a redação da Lei 14.905/2024. A calculadora de correção monetária e juros gera a memória de cálculo do débito.",
      },
    ],
  },
  "/modelos-de-minutas/acordo-extrajudicial-homologacao": {
    heading: "Modelo de acordo extrajudicial com homologação",
    intro:
      "Minuta editável de acordo extrajudicial acompanhada de petição conjunta de homologação judicial, com base nos arts. 515, III, e 725, VIII, do CPC. Homologado, o acordo vira título executivo judicial, o que permite cumprimento de sentença direto em caso de descumprimento.",
    bullets: [
      "Qualificação das partes, objeto do acordo e descrição da obrigação de cada uma.",
      "Valor, forma de pagamento, parcelas, vencimentos e índice de correção.",
      "Cláusula penal e vencimento antecipado das parcelas em caso de inadimplemento.",
      "Quitação, com delimitação do que está sendo quitado, para evitar discussão futura.",
      "Petição conjunta de homologação, art. 725, VIII, do CPC, com pedido de extinção quando houver processo em curso.",
      "Checklist de conferência e exportação em PDF e Word.",
    ],
    faq: [
      {
        question: "Precisa homologar o acordo?",
        answer:
          "Não é obrigatório. Sem homologação, o acordo assinado por duas testemunhas já é título executivo extrajudicial, art. 784, III, do CPC. Com homologação, vira título judicial, art. 515, III, e o descumprimento é cobrado por cumprimento de sentença, com trâmite mais rápido.",
      },
      {
        question: "Onde pedir a homologação?",
        answer:
          "No juízo competente pelo domicílio das partes ou pela matéria, em procedimento de jurisdição voluntária, art. 725, VIII, do CPC. Havendo processo em curso, o pedido é feito nos próprios autos, com requerimento de extinção pelo art. 487, III, b.",
      },
      {
        question: "O acordo pode incluir direitos trabalhistas?",
        answer:
          "Sim, pelo processo de jurisdição voluntária dos arts. 855-B a 855-E da CLT, com advogado distinto para cada parte. O juiz do trabalho pode homologar em parte, e a quitação alcança apenas o que estiver expresso.",
      },
      {
        question: "O que fazer se a outra parte não pagar?",
        answer:
          "Com acordo homologado, é cumprimento de sentença, com multa de 10% e honorários de 10% em caso de não pagamento em 15 dias, art. 523 do CPC. Sem homologação, é execução de título extrajudicial.",
      },
      {
        question: "Como atualizar parcelas em atraso?",
        answer:
          "Pelo índice e pelos juros previstos no próprio acordo; na omissão, aplica-se o art. 406 do Código Civil com a Lei 14.905/2024. A calculadora de correção monetária e juros entrega a memória mês a mês para instruir a cobrança.",
      },
    ],
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
  ...Object.fromEntries(
    RESCISAO_SITUACOES.map((s) => [
      rescisaoPath(s.slug),
      {
        heading: s.title,
        intro: s.description,
        bullets: [...s.features, ...s.paragraphs.map((p) => `${p.heading}: ${p.body}`)],
        faq: s.faq,
      } satisfies RouteContent,
    ]),
  ),
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
