// Páginas por índice de correção monetária.
// Fonte única: alimenta as rotas, as meta tags (routeMeta.ts) e o conteúdo
// estático injetado no HTML (routeContent.ts).
// TypeScript puro: sem React e sem APIs de browser, roda também em Node.

import { FaqItem } from "./faqData";

export type CorrecaoIndice = {
  slug: string;
  /** Título da página, usado no H1. */
  title: string;
  /** Resposta direta, um parágrafo. */
  description: string;
  /** Title da aba e do resultado de busca. */
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  /** O que a calculadora entrega neste índice. */
  features: string[];
  /** Parágrafos do bloco explicativo, em texto puro. */
  paragraphs: { heading: string; body: string }[];
  faq: FaqItem[];
};

export const CORRECAO_BASE_PATH = "/calculadoras/correcao-monetaria-juros-lei-14905";

export function correcaoPath(slug: string) {
  return `${CORRECAO_BASE_PATH}/${slug}`;
}

export const CORRECAO_INDICES: CorrecaoIndice[] = [
  {
    slug: "ipca",
    title: "Correção monetária pelo IPCA",
    description:
      "O IPCA é o índice oficial de inflação do país, medido pelo IBGE, e é o padrão adotado pela Justiça comum para atualizar condenações cíveis, contratos sem índice próprio e valores de repetição de indébito. O cálculo aqui usa a série 433 do Banco Central, mês a mês, com memória aberta.",
    seoTitle: "Calculadora de correção monetária pelo IPCA",
    seoDescription:
      "Atualize valores pelo IPCA com a série oficial do Banco Central, mês a mês, com juros e memória de cálculo exportável. Grátis, sem login.",
    keywords: [
      "correção monetária IPCA",
      "atualizar valor pelo IPCA",
      "calculadora IPCA",
      "índice IBGE",
      "atualização de condenação",
    ],
    features: [
      "Série oficial do IPCA (SGS 433), sincronizada diariamente",
      "Fator acumulado mês a mês entre as duas datas escolhidas",
      "Juros de mora somados conforme o regime da Lei 14.905/2024",
      "Pró-rata nos meses incompletos de início e fim",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "Quando o IPCA é o índice certo",
        body: "O IPCA é a escolha usual para condenações cíveis, indenizações por dano moral e material, repetição de indébito e contratos que não fixaram índice próprio. A partir da Lei 14.905/2024 ele passou a ser o índice legal de correção do Código Civil, aplicável quando não houver convenção entre as partes.",
      },
      {
        heading: "Como o cálculo é feito",
        body: "O valor original é multiplicado pelo fator acumulado do IPCA entre a data inicial e a data final. Cada mês entra com a variação divulgada pelo IBGE e publicada na série 433 do Banco Central. Meses incompletos entram pro rata die, pela contagem de dias. A memória mostra cada linha, então o número pode ser conferido.",
      },
      {
        heading: "IPCA e juros são coisas diferentes",
        body: "A correção recompõe o poder de compra do valor, os juros remuneram a mora. Somar um ao outro é correto, confundir os dois não. Na regra atual, os juros correspondem à Selic deduzido o IPCA, o que evita a dupla contagem da inflação.",
      },
    ],
    faq: [
      {
        question: "Qual a diferença entre IPCA e IPCA-E?",
        answer:
          "O IPCA-E é a versão especial, apurada em período de coleta antecipado e usada em precatórios e em alguns cálculos da Justiça Federal. O IPCA cheio é o índice mensal de referência da inflação oficial. A calculadora traz as duas séries.",
      },
      {
        question: "Posso usar IPCA em contrato de aluguel?",
        answer:
          "Pode, se o contrato indicar o IPCA. Quando o contrato é silente, prevalece o índice pactuado no setor, e a locação costuma usar IGP-M. Havendo cláusula expressa, ela prevalece sobre o índice legal.",
      },
      {
        question: "De onde vem o índice usado no cálculo?",
        answer:
          "Da série 433 do sistema de séries temporais do Banco Central, que reproduz o IPCA divulgado pelo IBGE. A tela mostra a data da última sincronização.",
      },
      {
        question: "O IPCA negativo reduz o valor da dívida?",
        answer:
          "Na atualização mês a mês, a deflação de um mês reduz o fator daquele mês. Já nos juros do art. 406 do Código Civil, resultado negativo é desconsiderado por força do §3º.",
      },
      {
        question: "Até que data o cálculo pode chegar?",
        answer:
          "Até o último mês com índice divulgado. Meses ainda sem divulgação do IBGE não entram, e a memória indica o mês de corte.",
      },
    ],
  },
  {
    slug: "inpc",
    title: "Correção monetária pelo INPC",
    description:
      "O INPC mede a inflação das famílias de renda mais baixa e é o índice usual para débitos trabalhistas e previdenciários, incluindo o reajuste dos benefícios do INSS. O cálculo usa a série 188 do Banco Central, mês a mês.",
    seoTitle: "Calculadora de correção monetária pelo INPC",
    seoDescription:
      "Atualize débitos trabalhistas e previdenciários pelo INPC com a série oficial do Banco Central, mês a mês, com memória de cálculo. Grátis, sem login.",
    keywords: [
      "correção monetária INPC",
      "atualizar valor pelo INPC",
      "calculadora INPC",
      "reajuste de benefício INSS",
      "débito previdenciário",
    ],
    features: [
      "Série oficial do INPC (SGS 188), sincronizada diariamente",
      "Uso típico em verbas trabalhistas e benefícios previdenciários",
      "Fator acumulado mês a mês, com pró-rata nas pontas",
      "Juros somados conforme o regime aplicável ao período",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "Quando o INPC é o índice certo",
        body: "O INPC é adotado no reajuste dos benefícios previdenciários que não são o salário mínimo e aparece com frequência em atrasados do INSS e em cálculos de liquidação na Justiça do Trabalho, conforme o critério fixado na decisão. Ele acompanha o consumo de famílias com renda de até cinco salários mínimos.",
      },
      {
        heading: "Como o cálculo é feito",
        body: "O valor entra corrigido pelo fator acumulado do INPC entre as duas datas. Cada mês usa a variação divulgada pelo IBGE na série 188. Meses incompletos entram pro rata die. A memória lista todas as linhas, com o fator de cada mês e o valor acumulado.",
      },
      {
        heading: "INPC e IPCA não dão o mesmo resultado",
        body: "As duas séries medem inflação, mas com cestas e faixas de renda diferentes, então divergem ao longo do tempo. Em períodos longos a diferença é relevante. Use o índice que a decisão, o contrato ou a lei indicar, e não o que resulta em valor maior.",
      },
    ],
    faq: [
      {
        question: "Qual índice a Justiça do Trabalho usa?",
        answer:
          "Depende do período e do que a decisão determinou. Em muitos casos o critério foi o IPCA-E na fase pré-judicial e a taxa Selic a partir do ajuizamento, conforme a decisão do STF nas ADCs 58 e 59, mas há decisões que fixam INPC. Siga o título executivo.",
      },
      {
        question: "O INPC corrige atrasados do INSS?",
        answer:
          "É o índice usado no reajuste anual dos benefícios acima do piso. Na liquidação de atrasados, o critério é o fixado na sentença ou no manual de cálculos aplicável.",
      },
      {
        question: "De onde vem o índice?",
        answer:
          "Da série 188 do Banco Central, que reproduz o INPC divulgado pelo IBGE. A tela mostra a data da última sincronização.",
      },
      {
        question: "Posso somar juros ao INPC?",
        answer:
          "Sim, correção e juros são parcelas distintas. A calculadora aplica o regime de juros vigente em cada trecho do período, inclusive o corte de 30 de agosto de 2024.",
      },
      {
        question: "Serve para dívida entre particulares?",
        answer:
          "Serve, se as partes pactuaram o INPC. Sem pactuação, o índice legal do Código Civil hoje é o IPCA.",
      },
    ],
  },
  {
    slug: "igpm",
    title: "Correção monetária pelo IGP-M",
    description:
      "O IGP-M, calculado pela Fundação Getulio Vargas, é o índice tradicional de reajuste de contratos de locação e de alguns contratos empresariais. Ele combina preços no atacado, ao consumidor e da construção, o que o torna mais volátil que o IPCA.",
    seoTitle: "Calculadora de correção monetária pelo IGP-M",
    seoDescription:
      "Reajuste aluguel e contratos pelo IGP-M com a série oficial do Banco Central, mês a mês, com memória de cálculo exportável. Grátis, sem login.",
    keywords: [
      "correção monetária IGP-M",
      "reajuste de aluguel IGP-M",
      "calculadora IGP-M",
      "índice FGV",
      "reajuste de contrato",
    ],
    features: [
      "Série oficial do IGP-M (SGS 189), sincronizada diariamente",
      "Reajuste anual de locação pelo acumulado de doze meses",
      "Fator acumulado mês a mês entre datas livres",
      "Juros de mora somados quando houver atraso",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "Quando o IGP-M é o índice certo",
        body: "O IGP-M é o índice mais usado em cláusula de reajuste de aluguel residencial e comercial, e aparece também em contratos de prestação de serviço de longo prazo. Ele só se aplica quando o contrato o indica. Sem cláusula, o índice legal do Código Civil é o IPCA.",
      },
      {
        heading: "Reajuste anual de aluguel",
        body: "No reajuste de locação, aplica-se o acumulado do IGP-M nos doze meses anteriores ao mês de aniversário do contrato. Basta informar o valor vigente e o período de doze meses. A calculadora devolve o novo valor e a variação aplicada, com cada mês visível na memória.",
      },
      {
        heading: "Volatilidade e renegociação",
        body: "Como o IGP-M carrega preços no atacado e a variação do dólar, ele dispara em períodos de câmbio alto e pode ficar bem acima da inflação ao consumidor. Em cenários assim, é comum a negociação de índice alternativo ou a revisão judicial do valor. Comparar o resultado do IGP-M com o do IPCA ajuda a sustentar a conversa.",
      },
    ],
    faq: [
      {
        question: "Posso trocar o IGP-M por IPCA no aluguel?",
        answer:
          "Por acordo entre as partes, sim, com aditivo contratual. Sem acordo, a troca depende de decisão judicial que reconheça desequilíbrio no contrato.",
      },
      {
        question: "Qual período de doze meses devo usar?",
        answer:
          "Os doze meses encerrados no mês anterior ao aniversário do contrato, que é o índice já divulgado na data do reajuste.",
      },
      {
        question: "IGP-M negativo reduz o aluguel?",
        answer:
          "Se o acumulado de doze meses for negativo, o valor cai, salvo cláusula que vede a redução. Convém verificar o texto do contrato.",
      },
      {
        question: "De onde vem o índice?",
        answer:
          "Da série 189 do Banco Central, que reproduz o IGP-M divulgado pela FGV. A tela mostra a data da última sincronização.",
      },
      {
        question: "Serve para atualizar condenação judicial?",
        answer:
          "Só quando a decisão ou o contrato discutido determinar o IGP-M. Para condenação cível sem índice pactuado, o padrão atual é o IPCA.",
      },
    ],
  },
  {
    slug: "selic",
    title: "Correção e juros pela taxa Selic",
    description:
      "A Selic acumulada é usada em débitos tributários federais e em várias condenações judiciais, e tem uma característica própria: ela já engloba correção monetária e juros, então nada mais pode ser somado sobre ela a esse título.",
    seoTitle: "Calculadora de atualização pela taxa Selic",
    seoDescription:
      "Atualize débitos pela Selic acumulada com a série oficial do Banco Central, mês a mês, com memória de cálculo exportável. Grátis, sem login.",
    keywords: [
      "atualização pela Selic",
      "calculadora Selic acumulada",
      "juros Selic",
      "débito tributário federal",
      "restituição de imposto",
    ],
    features: [
      "Série oficial da Selic mensal (SGS 4390), sincronizada diariamente",
      "Acumulação mês a mês, com 1% no mês do pagamento na regra tributária federal",
      "Uso em débitos federais, restituições e condenações com Selic fixada",
      "Aviso de dupla contagem quando a Selic é somada a outro índice",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "Selic já embute correção e juros",
        body: "Somar IPCA ou juros de 1% ao mês sobre um valor já atualizado pela Selic gera dupla contagem, e é um dos erros mais comuns em cálculo de liquidação. Quando a decisão manda aplicar a Selic, ela é a parcela única de atualização.",
      },
      {
        heading: "Débitos e restituições federais",
        body: "Na esfera tributária federal, a Selic acumulada é aplicada desde o mês seguinte ao do vencimento ou do pagamento indevido, somando 1% no mês em que a quitação ou a restituição ocorre. A calculadora segue essa contagem e mostra cada mês na memória.",
      },
      {
        heading: "Selic no Código Civil depois da Lei 14.905/2024",
        body: "Desde 30 de agosto de 2024, os juros legais do art. 406 do Código Civil correspondem à Selic deduzido o IPCA do período, justamente para separar juros de correção. Nesse regime, a Selic não entra sozinha, entra como componente do cálculo dos juros.",
      },
    ],
    faq: [
      {
        question: "Posso somar juros de 1% ao mês à Selic?",
        answer:
          "Não. A Selic já contém juros e correção. Somar outra parcela a esse título configura bis in idem e costuma ser afastado em impugnação ao cálculo.",
      },
      {
        question: "Qual série é usada?",
        answer:
          "A Selic mensal acumulada, série 4390 do Banco Central. A tela mostra a data da última sincronização.",
      },
      {
        question: "Como fica o mês do pagamento?",
        answer:
          "Na regra tributária federal, o mês da quitação entra com 1%, e não com a taxa apurada do mês, que ainda não está fechada.",
      },
      {
        question: "Serve para condenação cível?",
        answer:
          "Serve quando a decisão fixar a Selic como critério único. Se a decisão separar correção e juros, use o índice de correção indicado e o regime de juros correspondente.",
      },
      {
        question: "A Selic pode resultar em valor menor que o IPCA?",
        answer:
          "Pode, em períodos de inflação alta e juros baixos. Por isso o critério é o da decisão ou da lei, e não o que resulta em valor maior.",
      },
    ],
  },
  {
    slug: "taxa-legal",
    title: "Taxa Legal do Código Civil, Lei 14.905/2024",
    description:
      "Desde 30 de agosto de 2024 os juros legais do art. 406 do Código Civil correspondem à Selic deduzido o IPCA, divulgada pelo Banco Central como Taxa Legal. A correção monetária passou a ser feita pelo IPCA, em parcela separada.",
    seoTitle: "Calculadora da Taxa Legal, Lei 14.905/2024",
    seoDescription:
      "Calcule juros pela Taxa Legal do art. 406 do Código Civil (Selic menos IPCA) com a série do Banco Central e o corte de 30/08/2024. Grátis, com memória de cálculo.",
    keywords: [
      "Taxa Legal",
      "Lei 14.905/2024",
      "art. 406 do Código Civil",
      "juros legais",
      "Selic menos IPCA",
    ],
    features: [
      "Série oficial da Taxa Legal (SGS 29543), sincronizada diariamente",
      "Corte de 30 de agosto de 2024, com regime anterior antes e Taxa Legal depois",
      "Mês de transição em pro rata die, conforme a Res. CMN 5.171/2024",
      "Resultado negativo desconsiderado, conforme o art. 406, §3º",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "O que mudou",
        body: "Antes da Lei 14.905/2024 os juros legais eram de 1% ao mês, pela leitura consolidada do art. 406 combinado com o art. 161 do Código Tributário Nacional, e a correção seguia o índice do tribunal. Agora a correção é pelo IPCA e os juros são a Selic deduzido o IPCA, ambos em parcelas separadas e com fonte oficial.",
      },
      {
        heading: "O mês de transição",
        body: "A lei entrou em vigor em 30 de agosto de 2024, no meio do mês. O cálculo correto aplica o regime anterior até 29 de agosto e a Taxa Legal nos dias 30 e 31, em pro rata die, conforme a metodologia da Resolução CMN 5.171/2024. A calculadora faz esse corte automaticamente.",
      },
      {
        heading: "Quando o resultado é negativo",
        body: "Se o IPCA do período superar a Selic, a taxa apurada fica negativa. O art. 406, §3º, determina que nesse caso se considere taxa zero, ou seja, o valor não é reduzido a título de juros. A memória mostra os meses em que isso ocorreu.",
      },
      {
        heading: "Índice contratual continua valendo",
        body: "O art. 389, parágrafo único, do Código Civil preserva o índice de correção pactuado entre as partes. A Taxa Legal é regra supletiva: ela entra quando o contrato ou a decisão não fixou critério próprio.",
      },
    ],
    faq: [
      {
        question: "A Taxa Legal vale para dívidas anteriores à lei?",
        answer:
          "A lei vale a partir de 30 de agosto de 2024. Períodos anteriores seguem o regime antigo, e a calculadora divide o cálculo nos dois trechos.",
      },
      {
        question: "Ainda posso pedir 1% ao mês?",
        answer:
          "Para o período anterior a 30 de agosto de 2024, sim, conforme o entendimento aplicado ao caso. Depois dessa data, os juros legais são os da Taxa Legal, salvo taxa pactuada.",
      },
      {
        question: "Correção e juros são somados?",
        answer:
          "Sim, em parcelas separadas: correção pelo IPCA e juros pela Taxa Legal. A separação é justamente o que evita contar a inflação duas vezes.",
      },
      {
        question: "De onde vem a taxa?",
        answer:
          "Da série 29543 do Banco Central, que divulga a taxa do art. 406 do Código Civil. A tela mostra a data da última sincronização.",
      },
      {
        question: "E se o contrato tiver juros pactuados?",
        answer:
          "Os juros convencionados prevalecem, dentro dos limites legais. A Taxa Legal é aplicada na ausência de convenção.",
      },
    ],
  },
];
