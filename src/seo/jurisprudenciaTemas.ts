// Páginas de jurisprudência por tema. TypeScript puro (roda em Node no build).
// As decisões listadas são registros reais da tabela `decisions`, com link
// para a fonte oficial do tribunal. Não inventar decisões aqui.

import type { FaqItem } from "./faqData";

export type DecisaoTema = {
  id: string;
  tribunal: string;
  tipo: string;
  numero: string;
  relator: string;
  data: string; // ISO
  ementa: string;
  fonte: string;
};

export type JurisprudenciaTema = {
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  query: string;
  legislacao: { norma: string; conteudo: string }[];
  paragraphs: { heading: string; body: string }[];
  decisoes: DecisaoTema[];
  ferramentas: { to: string; label: string }[];
  faq: FaqItem[];
};

export const JURIS_TEMA_BASE = "/jurisprudencia/tema";
export const jurisTemaPath = (slug: string) => `${JURIS_TEMA_BASE}/${slug}`;

export const JURISPRUDENCIA_TEMAS: JurisprudenciaTema[] = [
  {
    slug: "dano-moral",
    title: "Jurisprudência sobre dano moral",
    description:
      "O dano moral é a lesão a direito da personalidade, reparável pelos arts. 186 e 927 do Código Civil e, nas relações de consumo, pelo art. 14 do CDC. Os tribunais exigem conduta, dano e nexo causal, e em algumas situações reconhecem o dano presumido (in re ipsa), como na inscrição indevida em cadastro de inadimplentes.",
    seoTitle: "Jurisprudência sobre dano moral: decisões reais e fundamentos",
    seoDescription:
      "Decisões reais de tribunais sobre dano moral, com número do processo, relator e link para a fonte oficial. Base legal, dano in re ipsa e critérios de valor.",
    query: "dano moral",
    legislacao: [
      { norma: "CF/88, art. 5º, V e X", conteudo: "Garante indenização por dano moral decorrente de violação à honra, intimidade e imagem." },
      { norma: "Código Civil, arts. 186 e 927", conteudo: "Ato ilícito e dever de reparar, inclusive o dano exclusivamente moral." },
      { norma: "CDC, art. 14", conteudo: "Responsabilidade objetiva do fornecedor por defeito na prestação do serviço." },
      { norma: "Súmula 385 do STJ", conteudo: "Anotação irregular não gera dano moral quando já existe inscrição legítima anterior." },
      { norma: "Súmula 387 do STJ", conteudo: "Dano estético e dano moral podem ser cumulados." },
    ],
    paragraphs: [
      {
        heading: "O que os tribunais examinam",
        body: "A decisão começa por três perguntas: houve conduta ilícita ou defeito no serviço, houve ofensa a direito da personalidade e existe nexo entre uma coisa e outra. Mero aborrecimento do cotidiano, sem repercussão, costuma ser afastado.",
      },
      {
        heading: "Como o valor é fixado",
        body: "Não existe tabela legal. O STJ adota o método bifásico: parte do valor usual em casos semelhantes e ajusta pelas circunstâncias do caso, como gravidade, duração da ofensa e condição das partes. Por isso a comparação com decisões do mesmo tribunal pesa.",
      },
    ],
    decisoes: [
      {
        id: "08b07936-f2fa-4260-8791-98aa9bba44b6",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0001490-32.2025.8.16.0108",
        relator: "Vanessa Bassani",
        data: "2026-03-14",
        ementa:
          "Direito civil e do consumidor. Recurso inominado. Ação de obrigação de fazer c/c indenizatória. Plano de saúde coletivo empresarial. Rescisão unilateral injustificada. Ausência de notificação. Inexistência de informação adequada aos beneficiários acerca do cancelamento. Dever de boa-fé. Restabelecimento do contrato devido. Dano moral configurado.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000036716891/Ac%C3%B3rd%C3%A3o-0001490-32.2025.8.16.0108",
      },
      {
        id: "6e32d8b7-535c-4be1-b84c-18bd061609c7",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "0001999-23.2023.8.26.0344",
        relator: "Ronnie Herbert Barros Soares",
        data: "2026-02-12",
        ementa:
          "Apelação cível. Compra e venda de bem imóvel. Ação de rescisão contratual c.c. indenização por dano moral e material. Vício construtivo. Danos materiais e morais devidos. Artigos 441 e 444 do Código Civil.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=20146345&cdForo=0",
      },
      {
        id: "00a62344-8105-4da2-9eb0-662dea963e93",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "1002783-62.2024.8.26.0177",
        relator: "Luis Fernando Camargo de Barros Vidal",
        data: "2026-02-04",
        ementa:
          "Direito civil. Apelação. Contrato bancário. Rescisão mantida. Ação de rescisão de contrato de financiamento de veículo, cessação de cobranças e indenização por danos morais. O autor exerceu o direito de arrependimento no prazo legal, devolvendo o bem à revendedora, e o banco continuou as cobranças.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=20111213&cdForo=0",
      },
    ],
    ferramentas: [
      { to: "/diagnostico", label: "Descrever o caso no Diagnóstico" },
      { to: "/modelos-de-minutas/peticao-inicial-cobranca", label: "Modelo de petição inicial" },
      { to: "/calculadoras/correcao-monetaria-juros-lei-14905", label: "Atualizar o valor da condenação" },
    ],
    faq: [
      {
        question: "Qual o prazo para pedir indenização por dano moral?",
        answer: "Na reparação civil em geral, três anos (art. 206, §3º, V, do Código Civil). Em fato do produto ou do serviço nas relações de consumo, cinco anos (art. 27 do CDC).",
      },
      {
        question: "O que é dano moral in re ipsa?",
        answer: "É o dano presumido, que dispensa prova do abalo porque decorre do próprio fato. O STJ o reconhece, por exemplo, na inscrição indevida em cadastro de inadimplentes. Fora dessas hipóteses, o abalo precisa ser demonstrado.",
      },
      {
        question: "Existe valor fixo de indenização por dano moral?",
        answer: "Não. O juiz arbitra o valor com base nas circunstâncias do caso. O STJ usa o método bifásico: valor usual em casos semelhantes, depois ajuste pelas particularidades.",
      },
      {
        question: "Mero aborrecimento gera dano moral?",
        answer: "Em regra, não. Os tribunais distinguem o dissabor comum da ofensa a direito da personalidade. Descumprimento contratual, sozinho, costuma não bastar, salvo repercussão que ultrapasse o inconveniente.",
      },
      {
        question: "Como corrigir o valor da indenização por dano moral?",
        answer: "Pela Súmula 362 do STJ, a correção monetária corre da data do arbitramento. Os juros seguem a regra do tipo de responsabilidade. Desde a Lei 14.905/2024, aplicam-se IPCA e Taxa Legal quando não há índice convencionado.",
      },
    ],
  },
  {
    slug: "dano-material",
    title: "Jurisprudência sobre dano material",
    description:
      "O dano material é o prejuízo patrimonial efetivo, dividido em danos emergentes (o que se perdeu) e lucros cessantes (o que razoavelmente se deixou de ganhar), conforme o art. 402 do Código Civil. Diferente do dano moral, ele precisa ser provado em valor.",
    seoTitle: "Jurisprudência sobre dano material: decisões reais e prova do prejuízo",
    seoDescription:
      "Decisões reais sobre dano material, danos emergentes e lucros cessantes, com número do processo, relator e link para a fonte oficial do tribunal.",
    query: "dano material",
    legislacao: [
      { norma: "Código Civil, art. 402", conteudo: "Perdas e danos abrangem o que se perdeu e o que razoavelmente se deixou de lucrar." },
      { norma: "Código Civil, art. 944", conteudo: "A indenização mede-se pela extensão do dano." },
      { norma: "CDC, arts. 12, 14 e 18", conteudo: "Responsabilidade do fornecedor por fato e por vício do produto ou serviço." },
      { norma: "Súmula 43 do STJ", conteudo: "Correção monetária sobre dívida por ato ilícito corre da data do efetivo prejuízo." },
      { norma: "Súmula 54 do STJ", conteudo: "Juros moratórios em responsabilidade extracontratual fluem desde o evento danoso." },
    ],
    paragraphs: [
      {
        heading: "A prova decide",
        body: "Nota fiscal, orçamento, recibo e laudo são o que sustenta o pedido. Sem prova do valor, o tribunal pode reconhecer o dever de indenizar e remeter a apuração à liquidação, ou negar o pedido.",
      },
      {
        heading: "Atualização do valor",
        body: "O prejuízo é corrigido desde a data em que ocorreu (Súmula 43 do STJ). O cálculo com índice oficial e memória mês a mês evita impugnação na fase de cumprimento de sentença.",
      },
    ],
    decisoes: [
      {
        id: "0730dede-fc1c-4b91-a32a-6718bb28bfb5",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "0014854-59.2024.8.26.0001",
        relator: "Vera Lúcia Calviño de Campos",
        data: "2025-06-26",
        ementa:
          "Recurso inominado do autor. Acidente de trânsito. Colisão entre veículo e motocicleta. Manobra de conversão à esquerda. Presunção de culpa do condutor do veículo de maior porte. Artigos 29, §2º, e 38 do CTB. Responsabilidade civil configurada. Dano material comprovado. Dano moral in re ipsa. Sentença reformada em parte.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=2017528&cdForo=9061",
      },
      {
        id: "4c41ece0-6449-4d63-b9fe-2a613f7d5252",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0003138-15.2023.8.16.0109",
        relator: "Camila Henning Salmoria",
        data: "2025-02-24",
        ementa:
          "Recurso inominado. Direito do consumidor. Vício em cama box. Ausência de solução administrativa. Dano material mantido. Responsabilidade objetiva. Dano moral não configurado. Falha na prestação do serviço que não gera dano moral in re ipsa. Recurso conhecido e parcialmente provido.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000031506211/Ac%C3%B3rd%C3%A3o-0003138-15.2023.8.16.0109",
      },
      {
        id: "3ad03f1b-a8e9-478b-b4c4-2d3abc90f683",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0016127-69.2022.8.16.0018",
        relator: "Helder Luis Henrique Taguchi",
        data: "2023-07-21",
        ementa:
          "Recurso inominado. Consumidor. Indenização. Danos moral e material. Compra pela internet de ingressos para festival de música. Evento adiado em razão da pandemia. Ausência de entrega das pulseiras na modalidade contratada, com taxa de entrega cobrada. Falha na prestação de serviços evidenciada.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000024161661/",
      },
    ],
    ferramentas: [
      { to: "/calculadoras/correcao-monetaria-juros-lei-14905/ipca", label: "Corrigir o prejuízo pelo IPCA" },
      { to: "/calculadoras/correcao-monetaria-juros-lei-14905/taxa-legal", label: "Calcular juros pela Taxa Legal" },
      { to: "/modelos-de-minutas/notificacao-extrajudicial", label: "Modelo de notificação extrajudicial" },
    ],
    faq: [
      {
        question: "Qual a diferença entre dano emergente e lucro cessante?",
        answer: "Dano emergente é a perda efetiva do patrimônio, como o conserto do carro. Lucro cessante é o ganho que razoavelmente deixou de ocorrer, como os dias sem trabalhar com o veículo (art. 402 do Código Civil).",
      },
      {
        question: "Preciso provar o valor do dano material?",
        answer: "Sim. Diferente do dano moral presumido, o dano material depende de prova do prejuízo. Orçamentos, notas fiscais e laudos são os meios mais usados.",
      },
      {
        question: "Desde quando corre a correção monetária do dano material?",
        answer: "Da data do efetivo prejuízo, pela Súmula 43 do STJ.",
      },
      {
        question: "Desde quando correm os juros?",
        answer: "Na responsabilidade extracontratual, desde o evento danoso (Súmula 54 do STJ). Na contratual, em regra desde a citação (art. 405 do Código Civil).",
      },
      {
        question: "Posso pedir dano material e moral no mesmo processo?",
        answer: "Sim. A Súmula 37 do STJ admite a cumulação das indenizações por dano material e moral oriundos do mesmo fato.",
      },
    ],
  },
  {
    slug: "plano-de-saude",
    title: "Jurisprudência sobre plano de saúde",
    description:
      "Os litígios com plano de saúde mais frequentes envolvem negativa de cobertura, rescisão unilateral e reajuste. Aplica-se o CDC (Súmula 608 do STJ, salvo autogestão) e a Lei 9.656/1998. Negativa indevida de tratamento urgente costuma gerar obrigação de custear e, conforme o caso, dano moral.",
    seoTitle: "Jurisprudência sobre plano de saúde: negativa de cobertura e rescisão",
    seoDescription:
      "Decisões reais sobre plano de saúde: negativa de medicamento, rescisão unilateral e dano moral, com número do processo, relator e link oficial.",
    query: "plano de saúde",
    legislacao: [
      { norma: "Lei 9.656/1998", conteudo: "Regula os planos privados de assistência à saúde, coberturas mínimas e rescisão." },
      { norma: "Lei 14.454/2022", conteudo: "Rol da ANS como referência básica, com cobertura de tratamento fora dele sob requisitos." },
      { norma: "Súmula 608 do STJ", conteudo: "O CDC se aplica aos planos de saúde, salvo os administrados por autogestão." },
      { norma: "Tema 1.082 do STJ", conteudo: "Operadora deve manter tratamento em curso de beneficiário após rescisão do plano coletivo, até a alta." },
    ],
    paragraphs: [
      {
        heading: "Negativa de cobertura",
        body: "Quando há prescrição médica fundamentada e a doença é coberta, os tribunais tendem a afastar a recusa baseada apenas em ausência no rol ou em uso fora da bula, observados os requisitos da Lei 14.454/2022.",
      },
      {
        heading: "Rescisão do plano coletivo",
        body: "A rescisão exige notificação prévia e, se houver beneficiário em tratamento, a continuidade da assistência até a alta (Tema 1.082 do STJ). Falta de comunicação aos usuários aparece com frequência como fundamento de condenação.",
      },
    ],
    decisoes: [
      {
        id: "d7e0f6d7-20eb-4cbf-8a2a-4a6f99273c25",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0018756-61.2023.8.16.0024",
        relator: "Vanessa Bassani",
        data: "2025-01-27",
        ementa:
          "Direito do consumidor e civil. Plano de saúde. Negativa de fornecimento de medicamento prescrito. Condição de saúde grave. Neoplasia maligna. Prescrição médica e recomendação internacional de uso. Dano moral configurado. Valor arbitrado adequado ao caso. Desprovimento.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000030797311/Ac%C3%B3rd%C3%A3o-0018756-61.2023.8.16.0024",
      },
      {
        id: "57e1a37e-00ea-49ce-a91c-b7d2d5b9dd12",
        tribunal: "TJMG",
        tipo: "Acórdão",
        numero: "1.0000.17.058513-7/003",
        relator: "Luís Carlos Gambogi",
        data: "2024-12-19",
        ementa:
          "Direito do consumidor. Apelação cível. Obrigação de fazer c/c indenização por danos morais. Plano de saúde coletivo. Rescisão unilateral por inadimplência da contratante. Ausência de comunicação aos usuários. Paciente em tratamento médico contínuo. Tema 1.082 do STJ. Danos morais configurados. Recurso parcialmente provido.",
        fonte: "https://www5.tjmg.jus.br/jurisprudencia/relatorioEspelhoAcordao.do?inteiroTeor=true&ano=17&ttriCodigo=1&codigoOrigem=0000&numero=058513&sequencial=003&sequencialAcordao=0",
      },
      {
        id: "08b07936-f2fa-4260-8791-98aa9bba44b6",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0001490-32.2025.8.16.0108",
        relator: "Vanessa Bassani",
        data: "2026-03-14",
        ementa:
          "Plano de saúde coletivo empresarial. Rescisão unilateral injustificada. Ausência de notificação. Inexistência de informação adequada aos beneficiários acerca do cancelamento. Ausência de oportunidade para continuidade da cônjuge supérstite no plano. Restabelecimento do contrato devido. Dano moral configurado.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000036716891/Ac%C3%B3rd%C3%A3o-0001490-32.2025.8.16.0108",
      },
    ],
    ferramentas: [
      { to: "/diagnostico", label: "Descrever o caso no Diagnóstico" },
      { to: "/modelos-de-minutas/notificacao-extrajudicial", label: "Modelo de notificação extrajudicial" },
      { to: "/modelos-de-minutas/peticao-inicial-cobranca", label: "Modelo de petição inicial" },
    ],
    faq: [
      {
        question: "O plano pode negar tratamento que não está no rol da ANS?",
        answer: "A Lei 14.454/2022 tornou o rol referência básica. Tratamento fora dele deve ser coberto quando houver comprovação de eficácia científica ou recomendação da Conitec ou de órgão internacional de renome, entre outros requisitos.",
      },
      {
        question: "O CDC se aplica ao plano de saúde?",
        answer: "Sim, pela Súmula 608 do STJ, exceto nos planos de autogestão.",
      },
      {
        question: "O plano coletivo pode ser cancelado durante um tratamento?",
        answer: "Pelo Tema 1.082 do STJ, mesmo com a rescisão do contrato coletivo, a operadora deve manter o tratamento de beneficiário internado ou em tratamento que garanta a sobrevivência, até a alta, desde que pagas as mensalidades.",
      },
      {
        question: "Negativa de cobertura gera dano moral?",
        answer: "Depende do caso. Recusa indevida em situação de urgência ou doença grave costuma ser reconhecida como dano moral. Divergência razoável de interpretação contratual, nem sempre.",
      },
      {
        question: "Qual o prazo para ação contra plano de saúde?",
        answer: "Para revisão de cláusula de reajuste com restituição, o STJ fixou três anos (Tema 610). Para outras pretensões, o prazo varia conforme o fundamento; convém conferir no caso concreto.",
      },
    ],
  },
  {
    slug: "usucapiao",
    title: "Jurisprudência sobre usucapião",
    description:
      "A usucapião é a aquisição da propriedade pela posse prolongada, com intenção de dono, sem interrupção nem oposição. O Código Civil prevê modalidades com prazos distintos: extraordinária (15 anos, ou 10 com moradia ou obras), ordinária (10 anos com justo título e boa-fé), especial rural e urbana (5 anos) e a de bens móveis (3 ou 5 anos).",
    seoTitle: "Jurisprudência sobre usucapião: decisões reais e requisitos",
    seoDescription:
      "Decisões reais de tribunais sobre usucapião extraordinária, ordinária, rural e de bem móvel, com número do processo, relator e link para a fonte oficial.",
    query: "usucapião",
    legislacao: [
      { norma: "Código Civil, art. 1.238", conteudo: "Usucapião extraordinária: 15 anos de posse, reduzidos a 10 se houver moradia habitual ou obras produtivas." },
      { norma: "Código Civil, art. 1.242", conteudo: "Usucapião ordinária: 10 anos de posse com justo título e boa-fé." },
      { norma: "Código Civil, art. 1.239 e CF/88, art. 191", conteudo: "Usucapião especial rural: até 50 hectares, 5 anos, área tornada produtiva e usada como moradia." },
      { norma: "Código Civil, art. 1.240 e CF/88, art. 183", conteudo: "Usucapião especial urbana: até 250 m², 5 anos, moradia própria ou da família." },
      { norma: "Código Civil, arts. 1.260 e 1.261", conteudo: "Usucapião de bem móvel: 3 anos com justo título e boa-fé, ou 5 anos sem eles." },
      { norma: "CPC, art. 1.071 e Lei 6.015/73, art. 216-A", conteudo: "Permite o reconhecimento extrajudicial da usucapião no cartório de registro de imóveis." },
    ],
    paragraphs: [
      {
        heading: "O que os tribunais examinam",
        body: "A prova central é a posse com intenção de dono (animus domini), contínua e sem oposição pelo prazo da modalidade escolhida. Pagamento de tributos, obras, contas no nome do possuidor e testemunhas de vizinhos costumam sustentar a decisão. Mera detenção ou posse por tolerância do proprietário não basta.",
      },
      {
        heading: "Modalidade errada nem sempre derruba o pedido",
        body: "Há decisões que aplicam a fungibilidade entre modalidades: quando o prazo da extraordinária não foi cumprido, mas os requisitos da ordinária estão provados, o tribunal reconhece a usucapião pela modalidade correta. Também é reconhecida a interversão da posse, quando a detenção inicial se transforma em posse de dono por atos inequívocos.",
      },
    ],
    decisoes: [
      {
        id: "f5c71b57-0c42-4e7c-ba85-eb68a197a8b0",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "1005331-71.2020.8.26.0445",
        relator: "Luis Fernando Nishi",
        data: "2026-06-03",
        ementa:
          "Direito civil. Apelação. Usucapião de bem móvel. Reforma da sentença. Veículo abandonado desde 2013, com pagamento de tributos e manutenção pelo autor. A posse, inicialmente detenção, transformou-se em posse ad usucapionem por interversão, com atos inequívocos de domínio, satisfazendo os requisitos do art. 1.261 do Código Civil. Recurso provido.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=20591507&cdForo=0",
      },
      {
        id: "2e56eadc-39cc-4ffa-9f9d-11b6c3ab99e7",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "0022838-11.2012.8.26.0100",
        relator: "Enio Zuliani",
        data: "2025-04-10",
        ementa:
          "Usucapião extraordinária prevista no art. 1.238 do CC. Posse animus domini incontroversa e com idade superior a trinta anos. Possuidores que agiram com publicidade e resistiram às tentativas de desalojamento. A Prefeitura Municipal de São Paulo não conseguiu provar que o imóvel seria bem público.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=19111042&cdForo=0",
      },
      {
        id: "cdd243fc-b0b2-4786-ab9e-087888b4f273",
        tribunal: "TJMG",
        tipo: "Acórdão",
        numero: "1.0000.25.013068-9/001",
        relator: "Tiago Gomes de Carvalho Pinto",
        data: "2025-03-26",
        ementa:
          "Apelação cível. Ação de usucapião extraordinária. Requisitos não preenchidos. Aplicação do princípio da fungibilidade entre modalidades. Usucapião ordinária (art. 1.242 do CC). Posse ininterrupta, pacífica, com justo título e boa-fé. Área inferior ao módulo mínimo de parcelamento: irrelevância. Recurso provido.",
        fonte: "https://www5.tjmg.jus.br/jurisprudencia/relatorioEspelhoAcordao.do?inteiroTeor=true&ano=25&ttriCodigo=1&codigoOrigem=0000&numero=013068&sequencial=001&sequencialAcordao=0",
      },
      {
        id: "5784c68e-33e9-45f8-9d6c-ced5e92f89ef",
        tribunal: "TJCE",
        tipo: "Acórdão",
        numero: "0008061-44.2010.8.06.0101",
        relator: "Francisco Jaime Medeiros Neto",
        data: "2024-04-10",
        ementa:
          "Ação de usucapião especial e de manutenção de posse sobre o mesmo imóvel rural, julgadas em conjunto. Procedência da usucapião na forma do art. 1.239 do Código Civil: posse e cultivo da terra confessados pelo recorrente e confirmados pela prova testemunhal. Improcedência da manutenção de posse.",
        fonte: "https://esaj.tjce.jus.br/cjsg/getArquivo.do?cdAcordao=3697044&cdForo=0",
      },
      {
        id: "c2fe88fc-acd4-44cc-95fe-55021682bced",
        tribunal: "TJMG",
        tipo: "Acórdão",
        numero: "1.0000.21.230148-5/001",
        relator: "Marcos Henrique Caldeira Brant",
        data: "2022-04-20",
        ementa:
          "Apelação cível. Ação de usucapião extraordinária. Posse com animus domini comprovada. Nos termos do art. 1.238 do CC, comprovada a posse com intenção de dono durante mais de 15 anos, sem interrupção nem oposição, deve-se reconhecer a prescrição aquisitiva. Recurso provido.",
        fonte: "https://www5.tjmg.jus.br/jurisprudencia/relatorioEspelhoAcordao.do?inteiroTeor=true&ano=21&ttriCodigo=1&codigoOrigem=0000&numero=230148&sequencial=001&sequencialAcordao=0",
      },
    ],
    ferramentas: [
      { to: "/diagnostico", label: "Descrever o caso no Diagnóstico" },
      { to: "/calculadoras/operacoes-datas", label: "Contar o tempo de posse entre duas datas" },
      { to: "/modelos-de-minutas/notificacao-extrajudicial", label: "Modelo de notificação extrajudicial" },
    ],
    faq: [
      {
        question: "Quanto tempo de posse é preciso para usucapião?",
        answer: "Depende da modalidade: 15 anos na extraordinária (10 com moradia ou obras), 10 anos na ordinária com justo título e boa-fé, 5 anos na especial urbana ou rural e 3 ou 5 anos para bens móveis.",
      },
      {
        question: "Dá para fazer usucapião em cartório?",
        answer: "Sim. O art. 216-A da Lei 6.015/73 permite o procedimento extrajudicial no registro de imóveis, com ata notarial, planta assinada por profissional habilitado e concordância ou silêncio dos confrontantes. Havendo impugnação, o caminho é judicial.",
      },
      {
        question: "Imóvel público pode ser usucapido?",
        answer: "Não. A Constituição (arts. 183, §3º, e 191, parágrafo único) e a Súmula 340 do STF vedam. Por isso a discussão sobre a natureza pública do bem aparece com frequência nas decisões.",
      },
      {
        question: "Posse de herdeiro ou de quem comprou por contrato de gaveta conta?",
        answer: "O possuidor pode somar a sua posse à dos antecessores (art. 1.243 do CC), desde que contínuas e pacíficas. Contrato particular de compra costuma servir como justo título na usucapião ordinária.",
      },
      {
        question: "Carro pode ser usucapido?",
        answer: "Sim, bens móveis também. São 3 anos com justo título e boa-fé ou 5 anos sem eles (arts. 1.260 e 1.261 do CC). A sentença serve para regularizar o registro no órgão de trânsito.",
      },
    ],
  },
];
