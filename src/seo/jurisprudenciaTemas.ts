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
  {
    slug: "atraso-de-voo",
    title: "Jurisprudência sobre atraso e cancelamento de voo",
    description:
      "Atraso, cancelamento e preterição de embarque são tratados como falha na prestação do serviço, com responsabilidade objetiva da companhia aérea (art. 14 do CDC). A discussão prática gira em torno de duas coisas: a causa alegada pela empresa é fortuito interno ou externo, e o transtorno passou do mero aborrecimento.",
    seoTitle: "Atraso e cancelamento de voo: jurisprudência e decisões reais",
    seoDescription:
      "Decisões reais de tribunais sobre atraso e cancelamento de voo, com número do processo, relator e link para a fonte oficial. Resolução 400 da ANAC, fortuito interno e valor do dano moral.",
    query: "atraso cancelamento voo dano moral",
    legislacao: [
      { norma: "CDC, art. 14", conteudo: "Responsabilidade objetiva do fornecedor por defeito na prestação do serviço, independente de culpa." },
      { norma: "Resolução 400/2016 da ANAC", conteudo: "Dever de informar a alteração e de prestar assistência material a partir de 1 hora (comunicação), 2 horas (alimentação) e 4 horas (hospedagem e traslado) de espera." },
      { norma: "Código Brasileiro de Aeronáutica, art. 251-A", conteudo: "O dano moral em atraso de voo depende de prova do prejuízo, salvo presunção legal." },
      { norma: "Convenção de Montreal", conteudo: "Aplicada ao transporte internacional, prevalece sobre o CDC nos danos materiais, conforme o Tema 210 do STF." },
      { norma: "Código Civil, art. 393", conteudo: "Exclusão da responsabilidade por caso fortuito ou força maior, base do debate entre fortuito interno e externo." },
    ],
    paragraphs: [
      {
        heading: "Fortuito interno e fortuito externo",
        body: "Manutenção não programada, readequação de malha aérea e problemas operacionais da empresa são tratados como risco do próprio negócio, o fortuito interno, e não afastam a indenização. Fechamento de aeroporto por condição meteorológica comprovada e determinação de autoridade aeronáutica podem ser reconhecidos como fortuito externo, desde que a companhia prove o fato com documento oficial e demonstre que prestou assistência.",
      },
      {
        heading: "O tamanho do atraso e a prova do transtorno",
        body: "Atrasos longos, com pernoite em aeroporto, perda de conexão ou de compromisso com data marcada, costumam levar ao reconhecimento do dano moral. Atrasos menores, sem repercussão demonstrada, encontram decisões que negam a indenização com base no art. 251-A do Código Brasileiro de Aeronáutica. Guarde cartão de embarque, comunicados da empresa, comprovantes de gasto e prova do compromisso perdido.",
      },
      {
        heading: "O que pedir além do dano moral",
        body: "Gastos com alimentação, transporte, hospedagem e diária de hotel não usufruída entram como dano material, mediante recibo. Quando a empresa nega o embarque por overbooking, a Resolução 400 prevê ainda a compensação financeira por preterição, cumulável com a reparação judicial.",
      },
    ],
    decisoes: [
      {
        id: "149ee4f2-4542-4be0-8a66-b3fbd7d60a97",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0013296-36.2025.8.16.0182",
        relator: "Tiago Gagliano Pinto Alberto",
        data: "2026-07-06",
        ementa:
          "Recurso inominado. Transporte aéreo internacional. Ação de indenização por danos morais. Cancelamento de voo. Manutenção não programada da aeronave. Fortuito interno. Atraso de aproximadamente 18 horas. Reacomodação para chegada ao destino apenas no dia seguinte. Responsabilidade civil objetiva. Danos morais configurados. Violação à legítima expectativa do consumidor. Critério bifásico. Quantum que não comporta minoração.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000036269821/Ac%C3%B3rd%C3%A3o-0013296-36.2025.8.16.0182",
      },
      {
        id: "a87f9a84-ede8-4b51-b809-5d12c12eebd8",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0002728-86.2025.8.16.0108",
        relator: "Alvaro Rodrigues Junior",
        data: "2026-06-02",
        ementa:
          "Direito do consumidor e processual civil. Recurso inominado. Transporte aéreo. Cancelamento de voo. Readequação de malha aérea. Atraso superior a 14 horas. Ausência de comprovação de força maior. Fortuito interno. Falha na prestação de serviços. Danos morais configurados. Manutenção do quantum indenizatório de R$ 2.000,00 para cada autora. Recurso desprovido.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000037856711/Ac%C3%B3rd%C3%A3o-0002728-86.2025.8.16.0108",
      },
      {
        id: "6f15d005-dc66-4400-96af-9b2da4c60d58",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "1001331-19.2025.8.26.0068",
        relator: "Luis Carlos de Barros",
        data: "2025-11-26",
        ementa:
          "Responsabilidade civil. Cancelamento de voo que levou a autora a chegar ao destino final com 22 horas de atraso. Voo nacional. Dano moral não pode ser presumido. Artigo 251-A do Código Brasileiro de Aeronáutica. REsp 1.584.465/MG. Situação dos autos que não evidencia o abalo moral. Recurso desprovido.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=20004645&cdForo=0",
      },
      {
        id: "464d893f-4266-4bca-8ee0-f28eb26e77e7",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "1021236-45.2024.8.26.0003",
        relator: "Maria Fernanda de Toledo Rodovalho",
        data: "2025-05-05",
        ementa:
          "Direito do consumidor e transporte aéreo. Atraso e cancelamento de voo. Realocação de passageiros em itinerário alterado. Fortuito externo. Excludente de responsabilidade. Inexistência de dano moral indenizável. Recurso provido.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=19177424&cdForo=0",
      },
      {
        id: "91e89964-37cf-437d-bfc3-c6631381bbf1",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0086166-11.2019.8.16.0014",
        relator: "Manuela Tallão Benke",
        data: "2021-11-29",
        ementa:
          "Recurso inominado. Transporte aéreo nacional. Ação indenizatória. Cancelamento de voo em razão do alegado mau tempo. Não atendimento à Resolução 400 da ANAC. Ausência de documento oficial comprovando a impossibilidade de decolagem. Perda de compromisso profissional. Abalo moral configurado. Indenização de R$ 5.000,00 para cada reclamante que não comporta minoração.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000018621281/Ac%C3%B3rd%C3%A3o-0086166-11.2019.8.16.0014",
      },
    ],
    ferramentas: [
      { to: "/diagnostico", label: "Descrever o caso no Diagnóstico" },
      { to: "/calculadoras/correcao-monetaria-juros-lei-14905", label: "Atualizar o valor dos gastos e da indenização" },
      { to: "/modelos-de-minutas/peticao-inicial-cobranca", label: "Modelo de petição inicial" },
    ],
    faq: [
      {
        question: "Quantas horas de atraso dão direito a indenização?",
        answer: "Não existe um número automático. A Resolução 400 da ANAC obriga assistência a partir de 1 hora e reacomodação ou reembolso a partir de 4 horas. O dano moral depende da repercussão concreta: pernoite em aeroporto, perda de conexão ou de compromisso com data marcada pesam mais do que a contagem isolada de horas.",
      },
      {
        question: "Mau tempo afasta a responsabilidade da companhia aérea?",
        answer: "Só quando a empresa prova o fechamento do aeroporto ou a restrição da autoridade aeronáutica com documento oficial, e demonstra que prestou assistência. Alegação genérica de condição meteorológica, sem prova, costuma ser rejeitada.",
      },
      {
        question: "Voo internacional segue a Convenção de Montreal ou o CDC?",
        answer: "Nos danos materiais do transporte internacional, o STF fixou no Tema 210 a prevalência da Convenção de Montreal, com seus limites de valor. O dano moral continua regido pelo CDC e pelo Código Civil.",
      },
      {
        question: "Qual o prazo para entrar com a ação?",
        answer: "Em voo nacional, cinco anos pelo art. 27 do CDC. Em voo internacional, dois anos pela Convenção de Montreal. A diferença de prazo é decisiva e precisa ser verificada antes de protocolar.",
      },
      {
        question: "Preciso de advogado para pedir indenização por atraso de voo?",
        answer: "No juizado especial cível, causas de até 20 salários mínimos dispensam advogado. Acima disso, ou em recurso, a representação é obrigatória.",
      },
    ],
  },
  {
    slug: "cartao-consignado-rmc",
    title: "Jurisprudência sobre cartão consignado e reserva de margem (RMC)",
    description:
      "O cartão de crédito consignado com reserva de margem consignável desconta um valor mínimo mensal do benefício ou do salário, sem prazo definido para quitar. Muitos contratantes acreditavam ter feito um empréstimo comum. Os tribunais decidem caso a caso: quando a contratação foi informada e assinada, o desconto é mantido; quando falta informação clara ao consumidor vulnerável, o contrato é anulado ou convertido em empréstimo consignado.",
    seoTitle: "Cartão consignado RMC: jurisprudência e decisões reais",
    seoDescription:
      "Decisões reais de tribunais sobre cartão de crédito consignado e reserva de margem consignável, com número do processo, relator e link para a fonte oficial. Prazo, nulidade e conversão em empréstimo.",
    query: "cartão consignado reserva de margem RMC",
    legislacao: [
      { norma: "CDC, arts. 6º, III, e 46", conteudo: "Direito à informação adequada e clara; o contrato não obriga o consumidor que não teve conhecimento prévio do seu conteúdo." },
      { norma: "CDC, art. 51, IV", conteudo: "Nulidade da cláusula que coloca o consumidor em desvantagem exagerada." },
      { norma: "Estatuto do Idoso, art. 96", conteudo: "Fundamenta a proteção reforçada do idoso na contratação de crédito." },
      { norma: "Lei 10.820/2003 e Lei 14.431/2022", conteudo: "Disciplinam o desconto em folha e o limite da margem consignável, incluindo a margem específica do cartão." },
      { norma: "CDC, art. 42, parágrafo único", conteudo: "Repetição em dobro do valor cobrado indevidamente, salvo engano justificável." },
    ],
    paragraphs: [
      {
        heading: "O ponto que decide o caso",
        body: "A discussão raramente é sobre a legalidade do produto, que é lícito. É sobre a prova da informação. Quando o banco apresenta proposta de adesão assinada, comprovante de saque do crédito e demonstra que o contratante era capaz, os tribunais mantêm a cobrança. Quando o contratante é idoso, semianalfabeto ou hipervulnerável e o banco não demonstra ter aferido a compreensão, a decisão tende à nulidade.",
      },
      {
        heading: "Nulidade, conversão e devolução",
        body: "As saídas mais comuns são três: manter o contrato, anulá-lo com devolução dos descontos, ou convertê-lo em empréstimo consignado comum, recalculando as parcelas pela taxa média de mercado e compensando o que já foi pago. A devolução em dobro depende do reconhecimento de má-fé ou de cobrança sem engano justificável.",
      },
      {
        heading: "Prazo para questionar",
        body: "O prazo prescricional é ponto controvertido. O TJPR fixou a tese do prazo quinquenal no IRDR 1746707-5. Antes de propor a ação, confira o marco adotado pelo tribunal do caso e a data do primeiro desconto, porque a contagem muda o pedido de devolução.",
      },
    ],
    decisoes: [
      {
        id: "9790f8af-482c-4a6e-b9ab-cbb4e52e8c70",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0076327-83.2024.8.16.0014",
        relator: "Luciane Bortoleto",
        data: "2026-03-07",
        ementa:
          "Direito civil e do consumidor. Apelação cível. Validade de contrato de cartão de crédito consignado e nulidade dos pedidos de devolução e danos morais. Recurso provido, julgando improcedentes os pedidos iniciais e invertendo os ônus sucumbenciais.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/4100000036256951/Ac%C3%B3rd%C3%A3o-0076327-83.2024.8.16.0014",
      },
      {
        id: "681e918f-13f9-485e-94db-973b639d425b",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "1001731-61.2025.8.26.0576",
        relator: "Roberto Maia",
        data: "2025-11-12",
        ementa:
          "Direito bancário e do consumidor. Ação declaratória de inexistência de débito e indenizatória por danos materiais e morais. Cartão de crédito consignado (RMC). Alegação de vício de consentimento. Contratação válida. Inexistência de nulidade ou violação às normas do INSS. Direito ao cancelamento do cartão. Obrigação de fazer. Recurso parcialmente provido.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=19954345&cdForo=0",
      },
      {
        id: "d1ef2a2d-59c6-46e2-829a-cb4eb26ae950",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0003303-57.2021.8.16.0101",
        relator: "Eduardo Novacki",
        data: "2025-09-10",
        ementa:
          "Direito civil e do consumidor. Apelação cível. Ação declaratória de nulidade contratual c/c repetição de indébito e danos morais. Contrato de cartão de crédito com reserva de margem consignável. Pessoa idosa e semianalfabeta. Hipervulnerabilidade do consumidor. Insuficiência dos mecanismos adotados pela agência bancária para aferir a plena aquiescência no momento da contratação. Vício de consentimento reconhecido.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/4100000033722801/Ac%C3%B3rd%C3%A3o-0003303-57.2021.8.16.0101",
      },
      {
        id: "a800599e-85c2-4582-b22b-f06f5ac44075",
        tribunal: "TJPR",
        tipo: "Decisão monocrática",
        numero: "0000301-10.2022.8.16.0145",
        relator: "José Daniel Toaldo",
        data: "2025-08-15",
        ementa:
          "Recurso inominado. Ação declaratória de inexistência de débito e nulidade contratual c/c restituição e indenização por danos morais. Cartão de crédito com reserva de margem consignável (RMC). Legalidade da contratação. Instrução Normativa do INSS 39/2009. Ausência de prova de vício na contratação.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/2100000034408792/Decis%C3%A3o%20monocr%C3%A1tica-0000301-10.2022.8.16.0145",
      },
      {
        id: "01c9ee6a-d8d0-44cb-986a-e72a17a98209",
        tribunal: "TJMG",
        tipo: "Acórdão",
        numero: "5000988-40.2021.8.13.0396",
        relator: "Ivone Guilarducci",
        data: "2024-04-29",
        ementa:
          "Recurso inominado. Contratação de cartão de crédito consignado. Reserva de margem consignável (RMC). Comprovação. Contrato devidamente assinado. Pessoa maior e capaz. Dever de indenizar inexistente. Se as condições contratuais foram livremente pactuadas e aceitas, não cabe atribuir à parte ré a prática de conduta ilícita.",
        fonte: "https://www5.tjmg.jus.br/jurisprudencia/downloadDocumentoPJe.do?numero=261dab4c93b687ad1094d7134074dffae953e6d3",
      },
    ],
    ferramentas: [
      { to: "/diagnostico", label: "Descrever o caso no Diagnóstico" },
      { to: "/calculadoras/correcao-monetaria-juros-lei-14905", label: "Atualizar os descontos para devolução" },
      { to: "/modelos-de-minutas/notificacao-extrajudicial", label: "Modelo de notificação extrajudicial" },
    ],
    faq: [
      {
        question: "O cartão de crédito consignado é ilegal?",
        answer: "Não. O produto é lícito e previsto na legislação do crédito consignado. O que os tribunais anulam é a contratação feita sem informação clara, sobretudo quando o contratante acreditava ter tomado um empréstimo consignado comum.",
      },
      {
        question: "Qual a diferença entre RMC e empréstimo consignado?",
        answer: "No empréstimo consignado o número de parcelas é definido e a dívida termina. Na reserva de margem consignável, o desconto mensal cobre apenas o valor mínimo da fatura do cartão, o saldo restante rende juros rotativos e a cobrança pode não ter fim.",
      },
      {
        question: "Dá para converter o cartão consignado em empréstimo?",
        answer: "Sim, é um dos desfechos frequentes. O juiz determina o recálculo como consignado comum pela taxa média de mercado e a compensação do que já foi descontado, com devolução do excesso.",
      },
      {
        question: "A devolução dos descontos é simples ou em dobro?",
        answer: "Depende. A devolução em dobro do art. 42, parágrafo único, do CDC exige cobrança indevida sem engano justificável. Havendo dúvida razoável sobre a validade do contrato, os tribunais costumam determinar a devolução simples.",
      },
      {
        question: "Qual o prazo para questionar os descontos?",
        answer: "O tema é controvertido e varia por tribunal. No TJPR, a tese fixada no IRDR 1746707-5 adota o prazo de cinco anos. Confira o entendimento do tribunal competente e a data do primeiro desconto antes de calcular o pedido.",
      },
    ],
  },
  {
    slug: "execucao-e-penhora",
    title: "Jurisprudência sobre execução e penhora de salário",
    description:
      "Salários, aposentadorias e pensões são impenhoráveis pelo art. 833, IV, do CPC. A regra, porém, deixou de ser absoluta: o STJ admite a penhora de percentual quando ela não compromete a subsistência digna do devedor e da família. Na prática, o tribunal olha o valor do rendimento, o percentual pedido e a prova das despesas.",
    seoTitle: "Penhora de salário na execução: jurisprudência e decisões reais",
    seoDescription:
      "Decisões reais de tribunais sobre penhora de salário e de benefício previdenciário em execução, com número do processo, relator e link para a fonte oficial. Art. 833 do CPC e limites da mitigação.",
    query: "penhora salário impenhorabilidade execução",
    legislacao: [
      { norma: "CPC, art. 833, IV", conteudo: "Impenhorabilidade de salários, vencimentos, proventos de aposentadoria, pensões e verbas de natureza alimentar." },
      { norma: "CPC, art. 833, §2º", conteudo: "Exceção expressa para prestação alimentícia e para a importância que exceder 50 salários mínimos mensais." },
      { norma: "CPC, art. 529, §3º", conteudo: "Desconto em folha de até 50% dos rendimentos líquidos no cumprimento de sentença de alimentos." },
      { norma: "CPC, art. 854", conteudo: "Bloqueio eletrônico de ativos financeiros pelo SISBAJUD e prazo de cinco dias para o executado comprovar a impenhorabilidade." },
      { norma: "Lei 8.009/90", conteudo: "Impenhorabilidade do bem de família, discutida em conjunto com a penhora de rendimentos na exceção de pré-executividade." },
      { norma: "EREsp 1.874.222/DF (STJ)", conteudo: "Admite a mitigação da impenhorabilidade quando preservado o mínimo existencial do devedor." },
    ],
    paragraphs: [
      {
        heading: "Quando o tribunal libera a penhora parcial",
        body: "A mitigação aparece quando o rendimento é alto o bastante para suportar o desconto sem afetar moradia, alimentação e saúde. Percentuais entre 10% e 30% são os mais discutidos. Quando o rendimento gira em torno de dois ou três salários mínimos, as decisões consultadas mantêm a impenhorabilidade integral.",
      },
      {
        heading: "O que cada lado precisa provar",
        body: "Ao exequente cabe demonstrar que o devedor tem capacidade de arcar com o percentual sem prejuízo do sustento, normalmente com extratos e sinais de padrão de vida. Ao executado cabe comprovar a origem salarial ou previdenciária do valor bloqueado e as despesas essenciais. Extrato genérico, dos dois lados, costuma não sustentar o pedido.",
      },
      {
        heading: "Bloqueio pelo SISBAJUD e o caminho processual",
        body: "Bloqueado o valor, o executado tem cinco dias para alegar a impenhorabilidade (art. 854, §3º, do CPC). A discussão chega ao tribunal por agravo de instrumento, e é nele que se decide o percentual. A exceção de pré-executividade serve quando a matéria é de ordem pública e dispensa dilação probatória.",
      },
    ],
    decisoes: [
      {
        id: "56d200d8-6b36-4db1-a415-91aeb98dfc85",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0111208-94.2025.8.16.0000",
        relator: "Vania Maria da Silva Kramer",
        data: "2026-05-22",
        ementa:
          "Direito processual civil. Agravo de instrumento. Execução de título extrajudicial. Penhora de verba salarial. Relativização da impenhorabilidade. Possibilidade. Valores bloqueados via SISBAJUD com natureza salarial reconhecida em exceção de pré-executividade. Recurso parcialmente conhecido e provido.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/4100000035300181/Ac%C3%B3rd%C3%A3o-0111208-94.2025.8.16.0000",
      },
      {
        id: "64fb8671-9bd9-4f6e-9efb-94290f027bec",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0135522-07.2025.8.16.0000",
        relator: "Luciano Campos de Albuquerque",
        data: "2026-05-05",
        ementa:
          "Direito processual civil. Agravo de instrumento. Impenhorabilidade de salário em execução de título extrajudicial. Recurso provido, reconhecendo a impenhorabilidade da integralidade do valor constrito na conta da executada, por decorrer de verba salarial, já que a penhora de qualquer percentual poderia interferir na sua subsistência.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/4100000036035271/Ac%C3%B3rd%C3%A3o-0135522-07.2025.8.16.0000",
      },
      {
        id: "f70fd45d-43ed-4dc8-b422-1dd02ab2ba18",
        tribunal: "TJPR",
        tipo: "Acórdão",
        numero: "0130758-75.2025.8.16.0000",
        relator: "Naor Ribeiro de Macedo Neto",
        data: "2026-04-07",
        ementa:
          "Direito processual civil. Agravo de instrumento. Decisão que indeferiu a penhora de percentual sobre salário. Montante encontrado via SISBAJUD oriundo de proventos previdenciários. Mitigação da regra do art. 833, IV, do CPC. Possibilidade de penhora parcial. Ausência de demonstração de prejuízo à subsistência do devedor. Recurso parcialmente provido.",
        fonte: "https://portal.tjpr.jus.br/jurisprudencia/j/4100000035879621/Ac%C3%B3rd%C3%A3o-0130758-75.2025.8.16.0000",
      },
      {
        id: "977077fc-6b29-463d-9d98-22ac1892983c",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "2016744-65.2025.8.26.0000",
        relator: "Sidney Braga",
        data: "2025-04-04",
        ementa:
          "Agravo de instrumento. Penhora. Bloqueio via SISBAJUD. Benefício previdenciário. Verba impenhorável. Art. 833, IV, do CPC. Mitigação que somente é possível quando a constrição não compromete a subsistência digna do devedor e da família. Devedor que percebe proventos inferiores a três salários mínimos. Penhora indeferida.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=19084306&cdForo=0",
      },
      {
        id: "5d26a356-0e66-4c52-8922-c568247c4631",
        tribunal: "TJSP",
        tipo: "Acórdão",
        numero: "2038152-15.2025.8.26.0000",
        relator: "Maria Fernanda de Toledo Rodovalho",
        data: "2025-03-05",
        ementa:
          "Direito processual civil. Agravo de instrumento. Execução de título extrajudicial. Penhora sobre salário. Impenhorabilidade relativa. Rendimento aproximado a dois salários mínimos. Comprometimento da subsistência do devedor. Impossibilidade de relativização. Decisão mantida.",
        fonte: "https://esaj.tjsp.jus.br/cjsg/getArquivo.do?cdAcordao=18953277&cdForo=0",
      },
    ],
    ferramentas: [
      { to: "/calculadoras/correcao-monetaria-juros-lei-14905", label: "Atualizar o valor do débito em execução" },
      { to: "/calculadoras/operacoes-datas", label: "Contar prazos processuais" },
      { to: "/diagnostico", label: "Descrever o caso no Diagnóstico" },
    ],
    faq: [
      {
        question: "Salário pode ser penhorado?",
        answer: "Em regra não, pelo art. 833, IV, do CPC. O texto abre exceção para dívida de alimentos e para a parte que ultrapassa 50 salários mínimos por mês. Fora disso, o STJ admite a penhora parcial quando ela não compromete a subsistência digna do devedor e da família.",
      },
      {
        question: "Qual percentual do salário os tribunais costumam autorizar?",
        answer: "Não há percentual fixo. As decisões discutem faixas de 10% a 30%, sempre conforme o valor do rendimento e a prova das despesas. Em rendimentos próximos de dois ou três salários mínimos, a penhora costuma ser negada por inteiro.",
      },
      {
        question: "Aposentadoria e pensão do INSS podem ser penhoradas?",
        answer: "Recebem a mesma proteção do salário. A mitigação é possível em tese, mas as decisões consultadas negam a constrição quando o benefício é baixo e compromete o sustento do aposentado.",
      },
      {
        question: "O que fazer quando a conta é bloqueada pelo SISBAJUD?",
        answer: "O executado tem cinco dias, a contar da intimação, para comprovar a impenhorabilidade (art. 854, §3º, do CPC), juntando extrato que mostre a origem salarial ou previdenciária do valor. Indeferido o pedido, o caminho é o agravo de instrumento.",
      },
      {
        question: "Na execução de alimentos a regra muda?",
        answer: "Sim. O art. 833, §2º, do CPC afasta expressamente a impenhorabilidade na dívida alimentar, e o art. 529, §3º, permite o desconto em folha de até 50% dos rendimentos líquidos.",
      },
    ],
  },
];
