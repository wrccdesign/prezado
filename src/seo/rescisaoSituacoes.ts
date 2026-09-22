// Páginas por situação de rescisão trabalhista.
// Fonte única: alimenta as rotas, as meta tags (routeMeta.ts) e o conteúdo
// estático injetado no HTML (routeContent.ts).
// TypeScript puro: sem React e sem APIs de browser, roda também em Node.

import { FaqItem } from "./faqData";

export type RescisaoSituacao = {
  slug: string;
  /** Título da página, usado no H1. */
  title: string;
  /** Resposta direta, um parágrafo. */
  description: string;
  /** Title da aba e do resultado de busca. */
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  /** O que a calculadora entrega nesta situação. */
  features: string[];
  /** Parágrafos do bloco explicativo, em texto puro. */
  paragraphs: { heading: string; body: string }[];
  faq: FaqItem[];
};

const BASE = "/calculadoras/rescisao-trabalhista";

export const RESCISAO_SITUACOES: RescisaoSituacao[] = [
  {
    slug: "demissao-sem-justa-causa",
    title: "Cálculo de rescisão na demissão sem justa causa",
    description:
      "Na dispensa sem justa causa o trabalhador recebe o conjunto completo das verbas rescisórias: saldo de salário, aviso prévio indenizado proporcional, 13º e férias proporcionais, férias vencidas com um terço, FGTS do mês e multa de 40% sobre o saldo da conta.",
    seoTitle: "Cálculo de demissão sem justa causa, grátis",
    seoDescription:
      "Calcule as verbas da dispensa sem justa causa: saldo de salário, aviso prévio proporcional, 13º e férias, FGTS e multa de 40%. Grátis, sem login, com memória de cálculo.",
    keywords: [
      "demissão sem justa causa",
      "cálculo rescisão",
      "multa de 40% do FGTS",
      "aviso prévio indenizado",
      "verbas rescisórias",
    ],
    features: [
      "Saldo de salário pelos dias trabalhados no mês da saída",
      "Aviso prévio indenizado proporcional: 30 dias mais 3 por ano completo, limitado a 90 (Lei 12.506/2011)",
      "13º salário e férias proporcionais, com um terço constitucional",
      "Férias vencidas com um terço, quando houver período aquisitivo completo",
      "FGTS do mês da saída (8%) e multa rescisória de 40% sobre o saldo mais o depósito do mês",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "O que é devido",
        body: "A dispensa por iniciativa do empregador, sem motivo previsto no art. 482 da CLT, gera o pacote completo. Entram o saldo de salário do mês da saída, o aviso prévio (trabalhado ou indenizado), o 13º proporcional aos meses do ano, as férias proporcionais e as vencidas, ambas com um terço, o depósito de FGTS do mês e a multa rescisória de 40% sobre todo o saldo da conta vinculada.",
      },
      {
        heading: "Aviso prévio proporcional",
        body: "A Lei 12.506/2011 fixa 30 dias de aviso prévio, acrescidos de 3 dias por ano completo de serviço na mesma empresa, com teto de 90 dias. Quando indenizado, o período conta como tempo de serviço para 13º, férias e FGTS. A calculadora aplica a proporcionalidade a partir das datas de admissão e de saída.",
      },
      {
        heading: "Prazo de pagamento",
        body: "O art. 477, §6º, da CLT fixa dez dias corridos, contados do término do contrato, para o pagamento das verbas rescisórias. O descumprimento gera a multa do §8º, no valor de um salário do empregado, além da correção do valor em atraso.",
      },
    ],
    faq: [
      {
        question: "A multa de 40% incide sobre o quê?",
        answer:
          "Sobre a totalidade dos depósitos de FGTS feitos durante o contrato, corrigidos, incluindo o depósito do mês da rescisão, ainda que o trabalhador já tenha sacado parte do saldo.",
      },
      {
        question: "O aviso prévio indenizado conta como tempo de serviço?",
        answer:
          "Sim. O período do aviso indenizado integra o tempo de serviço para todos os efeitos, inclusive 13º, férias proporcionais e depósito de FGTS, conforme o art. 487, §1º, da CLT.",
      },
      {
        question: "Tenho direito ao seguro-desemprego?",
        answer:
          "A dispensa sem justa causa é a hipótese típica de habilitação ao seguro-desemprego, desde que cumpridos os requisitos de tempo de vínculo da Lei 7.998/1990. A calculadora não estima o seguro-desemprego.",
      },
      {
        question: "Posso sacar o FGTS?",
        answer:
          "Sim, a dispensa sem justa causa permite o saque integral do saldo da conta vinculada, além do recebimento da multa rescisória.",
      },
      {
        question: "O cálculo já desconta INSS e Imposto de Renda?",
        answer:
          "Não. Os valores apresentados são brutos. Descontos previdenciários, fiscais, faltas, adiantamentos e verbas de convenção coletiva não entram na estimativa.",
      },
    ],
  },
  {
    slug: "pedido-de-demissao",
    title: "Cálculo de rescisão no pedido de demissão",
    description:
      "Quando o trabalhador pede demissão, permanecem o saldo de salário, o 13º proporcional e as férias proporcionais e vencidas com um terço. Não há multa do FGTS, não há saque da conta vinculada e o aviso prévio é devido pelo empregado ao empregador.",
    seoTitle: "Cálculo de pedido de demissão, o que recebo",
    seoDescription:
      "Veja o que é devido no pedido de demissão: saldo de salário, 13º e férias proporcionais com um terço, sem multa do FGTS. Cálculo grátis, sem login.",
    keywords: [
      "pedido de demissão",
      "o que recebo ao pedir demissão",
      "aviso prévio do empregado",
      "férias proporcionais",
      "13º proporcional",
    ],
    features: [
      "Saldo de salário pelos dias trabalhados no mês da saída",
      "13º salário proporcional aos meses do ano",
      "Férias proporcionais e vencidas, com um terço constitucional",
      "Sem multa do FGTS e sem aviso prévio indenizado a favor do empregado",
      "Estimativa do desconto de aviso prévio quando não cumprido",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "O que é devido",
        body: "No pedido de demissão continuam devidos o saldo de salário, o 13º proporcional, as férias proporcionais e as férias vencidas, todas com um terço. Ficam de fora o aviso prévio indenizado em favor do empregado e a multa de 40% do FGTS. O saldo da conta vinculada não pode ser sacado por esse motivo de saída, salvo hipótese legal específica.",
      },
      {
        heading: "Aviso prévio quando é o empregado que pede",
        body: "O aviso de 30 dias é devido pelo empregado ao empregador (art. 487 da CLT). Se ele não cumpre o período e não é dispensado desse cumprimento, o empregador pode descontar o valor correspondente das verbas rescisórias, conforme o §2º do mesmo artigo. A proporcionalidade da Lei 12.506/2011 beneficia apenas o empregado, não aumenta o aviso devido por ele.",
      },
      {
        heading: "Seguro-desemprego",
        body: "O pedido de demissão não dá direito ao seguro-desemprego, porque o benefício pressupõe dispensa sem justa causa. Quem quer encerrar o contrato de comum acordo e ainda assim sacar parte do FGTS deve olhar o acordo do art. 484-A da CLT.",
      },
    ],
    faq: [
      {
        question: "Recebo a multa de 40% do FGTS?",
        answer:
          "Não. A multa rescisória é devida apenas na dispensa sem justa causa (40%) e, pela metade, no acordo do art. 484-A da CLT (20%).",
      },
      {
        question: "Posso sacar o FGTS ao pedir demissão?",
        answer:
          "Não pelo motivo da saída. O saldo permanece na conta vinculada, salvo hipóteses legais próprias, como o saque-aniversário já aderido ou as situações do art. 20 da Lei 8.036/1990.",
      },
      {
        question: "O empregador pode descontar o aviso prévio?",
        answer:
          "Sim, se o empregado não cumpre o aviso de 30 dias e não é dispensado do cumprimento. O desconto corresponde ao salário do período, conforme o art. 487, §2º, da CLT.",
      },
      {
        question: "Tenho direito às férias vencidas?",
        answer:
          "Sim. As férias com período aquisitivo completo e não gozadas são devidas com o terço constitucional, independentemente do motivo da saída.",
      },
      {
        question: "Qual o prazo para receber?",
        answer:
          "Dez dias corridos contados do término do contrato, pelo art. 477, §6º, da CLT. O atraso gera a multa do §8º, equivalente a um salário do empregado.",
      },
    ],
  },
  {
    slug: "acordo-484a",
    title: "Cálculo de rescisão por acordo (art. 484-A da CLT)",
    description:
      "No distrato por acordo entre empregado e empregador o aviso prévio indenizado é pago pela metade, a multa do FGTS cai para 20% e o saque da conta vinculada fica limitado a 80% do saldo. As demais verbas são devidas integralmente.",
    seoTitle: "Cálculo do acordo trabalhista, art. 484-A da CLT",
    seoDescription:
      "Calcule a rescisão por acordo mútuo: aviso prévio pela metade, multa do FGTS de 20% e saque de até 80% do saldo. Cálculo grátis, com memória detalhada.",
    keywords: [
      "acordo art. 484-A CLT",
      "demissão por acordo",
      "multa de 20% do FGTS",
      "distrato trabalhista",
      "saque de 80% do FGTS",
    ],
    features: [
      "Aviso prévio indenizado reduzido à metade",
      "Multa do FGTS de 20% sobre o saldo mais o depósito do mês",
      "Saldo de salário, 13º e férias proporcionais integrais, com um terço",
      "Férias vencidas com um terço, quando houver",
      "Indicação do limite de 80% para saque da conta vinculada",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "O que muda no acordo",
        body: "O art. 484-A da CLT, incluído pela Lei 13.467/2017, permite encerrar o contrato por acordo. Nesse caso são pagos pela metade o aviso prévio indenizado e a multa do FGTS, que fica em 20%. Saldo de salário, 13º proporcional, férias proporcionais e vencidas com um terço permanecem integrais.",
      },
      {
        heading: "FGTS e seguro-desemprego",
        body: "A movimentação da conta vinculada é limitada a 80% do saldo, pelo §1º do art. 484-A. O acordo não habilita ao seguro-desemprego, conforme o §2º do mesmo artigo. É o ponto que costuma decidir entre o acordo e a dispensa sem justa causa.",
      },
      {
        heading: "Cuidado com o acordo simulado",
        body: "O acordo precisa refletir vontade real das duas partes. A dispensa disfarçada de acordo, feita só para reduzir o custo da saída, é nula e expõe o empregador ao pagamento integral das verbas e às penalidades da fiscalização.",
      },
    ],
    faq: [
      {
        question: "Quanto do FGTS posso sacar no acordo?",
        answer:
          "Até 80% do saldo da conta vinculada, conforme o art. 484-A, §1º, inciso I, da CLT. Os 20% restantes permanecem depositados.",
      },
      {
        question: "O acordo dá direito ao seguro-desemprego?",
        answer:
          "Não. O art. 484-A, §2º, da CLT exclui expressamente a habilitação ao seguro-desemprego nessa modalidade de encerramento.",
      },
      {
        question: "A multa do FGTS é de quanto?",
        answer:
          "20% sobre o saldo da conta vinculada acrescido do depósito do mês da rescisão, metade dos 40% da dispensa sem justa causa.",
      },
      {
        question: "O aviso prévio é sempre indenizado?",
        answer:
          "Pode ser trabalhado ou indenizado. Quando indenizado, é pago pela metade. Quando trabalhado, é cumprido integralmente e pago como salário do período.",
      },
      {
        question: "Precisa de homologação no sindicato?",
        answer:
          "Desde a Lei 13.467/2017 a homologação sindical deixou de ser obrigatória para a rescisão. Para dar quitação ampla, as partes podem submeter o acordo à homologação judicial do art. 855-B da CLT.",
      },
    ],
  },
  {
    slug: "justa-causa",
    title: "Cálculo de rescisão na demissão por justa causa",
    description:
      "Na dispensa por justa causa restam o saldo de salário e as férias vencidas com um terço, quando existirem. Não há aviso prévio, 13º proporcional, férias proporcionais, multa do FGTS nem saque da conta vinculada.",
    seoTitle: "Cálculo de demissão por justa causa, o que é devido",
    seoDescription:
      "Veja o que resta na justa causa: saldo de salário e férias vencidas com um terço. Sem aviso prévio, sem multa do FGTS. Cálculo grátis, com base na CLT.",
    keywords: [
      "demissão por justa causa",
      "art. 482 da CLT",
      "o que recebe na justa causa",
      "férias vencidas",
      "verbas rescisórias",
    ],
    features: [
      "Saldo de salário pelos dias trabalhados no mês da saída",
      "Férias vencidas com um terço, quando houver período aquisitivo completo",
      "Sem aviso prévio, 13º proporcional e férias proporcionais",
      "Sem multa do FGTS e sem saque da conta vinculada",
      "Comparação imediata com o valor da dispensa sem justa causa",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "O que é devido",
        body: "A justa causa reduz a rescisão ao saldo de salário e às férias vencidas com um terço. Ficam excluídos o aviso prévio, o 13º proporcional, as férias proporcionais, a multa de 40% e o saque do FGTS. A Súmula 171 do TST assegura as férias proporcionais em qualquer forma de extinção do contrato, salvo justa causa, o que reforça a exclusão.",
      },
      {
        heading: "As hipóteses do art. 482 da CLT",
        body: "A justa causa só existe nas condutas do art. 482 da CLT, entre elas improbidade, desídia, indisciplina, insubordinação, abandono de emprego e ato lesivo à honra. A prova é do empregador, e a jurisprudência exige proporcionalidade, imediatidade e ausência de punição anterior pelo mesmo fato.",
      },
      {
        heading: "Quando vale discutir a reversão",
        body: "Reconhecida a nulidade da justa causa na Justiça do Trabalho, a dispensa é convertida em sem justa causa e as verbas do pacote completo passam a ser devidas. Calcular os dois cenários lado a lado mostra o valor em disputa antes de decidir o ajuizamento.",
      },
    ],
    faq: [
      {
        question: "Recebo férias proporcionais na justa causa?",
        answer:
          "Não. A Súmula 171 do TST garante as férias proporcionais em qualquer extinção do contrato, exceto na dispensa por justa causa. As férias vencidas, com período aquisitivo completo, continuam devidas.",
      },
      {
        question: "Posso sacar o FGTS?",
        answer:
          "Não pelo motivo da saída, e não há multa rescisória. O saldo permanece na conta vinculada, salvo hipóteses legais próprias.",
      },
      {
        question: "A justa causa precisa ser motivada por escrito?",
        answer:
          "A lei não exige forma específica, mas o empregador precisa provar em juízo a conduta do art. 482 da CLT que motivou a dispensa. A comunicação escrita e documentada é a prática recomendada.",
      },
      {
        question: "O que acontece se a justa causa for revertida?",
        answer:
          "A dispensa passa a ser tratada como sem justa causa, com pagamento de aviso prévio, 13º e férias proporcionais, multa de 40% do FGTS e liberação do saque.",
      },
      {
        question: "O empregador pode aplicar justa causa por faltas?",
        answer:
          "Faltas reiteradas podem caracterizar desídia, mas a jurisprudência exige gradação da punição, advertência e suspensão antes da dispensa, salvo gravidade que justifique a medida imediata.",
      },
    ],
  },
  {
    slug: "contrato-de-experiencia",
    title: "Cálculo de rescisão no contrato de experiência",
    description:
      "No término normal do contrato de experiência são devidos saldo de salário, 13º e férias proporcionais com um terço e a multa de 40% do FGTS. Não há aviso prévio. Na quebra antecipada aplicam-se as indenizações dos arts. 479 e 480 da CLT.",
    seoTitle: "Rescisão de contrato de experiência, cálculo grátis",
    seoDescription:
      "Calcule a rescisão do contrato de experiência: término normal, quebra pelo empregador (art. 479) e pelo empregado (art. 480), com 13º e férias proporcionais.",
    keywords: [
      "contrato de experiência",
      "rescisão antecipada",
      "art. 479 da CLT",
      "art. 480 da CLT",
      "contrato por prazo determinado",
    ],
    features: [
      "Saldo de salário pelos dias trabalhados",
      "13º e férias proporcionais com um terço",
      "FGTS do mês e multa de 40% no término do contrato",
      "Indenização do art. 479: metade da remuneração do período restante",
      "Indenização do art. 480 quando a quebra parte do empregado",
      "Memória de cálculo exportável em PDF e Word",
    ],
    paragraphs: [
      {
        heading: "Término no prazo combinado",
        body: "O contrato de experiência é espécie de contrato por prazo determinado, limitado a 90 dias, com uma única prorrogação (art. 445, parágrafo único, da CLT). Chegando ao termo final, são devidos saldo de salário, 13º proporcional, férias proporcionais com um terço e o FGTS do período, com multa de 40%. Não há aviso prévio, porque a data de encerramento já era conhecida.",
      },
      {
        heading: "Quebra antecipada pelo empregador",
        body: "Se o empregador encerra antes do prazo sem justa causa, paga, além das verbas do término, a indenização do art. 479 da CLT: metade da remuneração a que o empregado teria direito até o fim do contrato. Havendo cláusula assecuratória de rescisão antecipada (art. 481), aplicam-se as regras do contrato por prazo indeterminado, inclusive aviso prévio.",
      },
      {
        heading: "Quebra antecipada pelo empregado",
        body: "Quando é o empregado que rompe antes do prazo, o art. 480 da CLT permite ao empregador cobrar indenização pelos prejuízos, limitada ao valor que o empregado receberia até o término. Nesse cenário não há multa do FGTS nem saque da conta vinculada.",
      },
    ],
    faq: [
      {
        question: "Tem aviso prévio no contrato de experiência?",
        answer:
          "No término na data combinada, não. O aviso prévio só aparece quando existe cláusula assecuratória de rescisão antecipada, prevista no art. 481 da CLT, e a quebra ocorre antes do prazo.",
      },
      {
        question: "Recebo a multa de 40% do FGTS?",
        answer:
          "Sim, no término normal do contrato e na quebra antecipada por iniciativa do empregador sem justa causa. Não há multa quando a saída parte do empregado ou quando há justa causa.",
      },
      {
        question: "Qual o prazo máximo da experiência?",
        answer:
          "90 dias no total, admitida uma única prorrogação dentro desse limite. Ultrapassado o prazo, o contrato passa a vigorar por prazo indeterminado.",
      },
      {
        question: "Como se calcula a indenização do art. 479?",
        answer:
          "Metade da remuneração que o empregado receberia do dia da dispensa até a data final combinada no contrato.",
      },
      {
        question: "Tenho direito ao seguro-desemprego?",
        answer:
          "O término de contrato por prazo determinado em regra não habilita ao seguro-desemprego, porque não se trata de dispensa sem justa causa em contrato indeterminado.",
      },
    ],
  },
];

export function rescisaoPath(slug: string): string {
  return `${BASE}/${slug}`;
}

export const RESCISAO_BASE_PATH = BASE;
