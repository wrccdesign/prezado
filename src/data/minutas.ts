export interface MinutaSection {
  heading: string;
  body: string;
}

export interface Minuta {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  metaDescription: string;
  keywords: string[];
  baseLegal: string[];
  checklist: string[];
  sections: MinutaSection[];
}

const FECHO = `Nestes termos,
Pede deferimento.

[Cidade/UF], [data].

[Nome do(a) advogado(a)]
OAB/[UF] nº [número]`;

export const MINUTAS: Minuta[] = [
  {
    slug: "peticao-inicial-cobranca",
    title: "Petição inicial de cobrança",
    category: "Cível",
    shortDescription:
      "Modelo de petição inicial para cobrança de dívida líquida sem título executivo, no procedimento comum.",
    metaDescription:
      "Modelo editável de petição inicial de cobrança (procedimento comum, art. 319 do CPC). Estrutura completa com fatos, direito, pedidos e valor da causa.",
    keywords: ["petição inicial de cobrança", "modelo petição cobrança", "ação de cobrança CPC"],
    baseLegal: [
      "CPC, art. 319 — requisitos da petição inicial",
      "CPC, art. 292 — valor da causa",
      "Código Civil, arts. 389 e 395 — inadimplemento, juros e correção",
      "Lei 14.905/2024 — correção pelo IPCA e juros pela taxa legal",
    ],
    checklist: [
      "Qualificação completa das partes (CPF/CNPJ, endereço, e-mail)",
      "Documentos que comprovam a dívida (contrato, notas, e-mails, comprovantes)",
      "Demonstrativo de cálculo atualizado até a data da distribuição",
      "Procuração e, se for o caso, pedido de justiça gratuita",
      "Opção pela realização ou não de audiência de conciliação (art. 319, VII)",
    ],
    sections: [
      {
        heading: "Endereçamento",
        body: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(ÍZA) DE DIREITO DA [nº] VARA CÍVEL DA COMARCA DE [Cidade/UF]`,
      },
      {
        heading: "Qualificação das partes",
        body: `[NOME DO AUTOR], [nacionalidade], [estado civil], [profissão], inscrito(a) no CPF sob o nº [___], residente e domiciliado(a) na [endereço completo], endereço eletrônico [e-mail], por seu(sua) advogado(a) que esta subscreve (procuração anexa), vem, respeitosamente, à presença de Vossa Excelência propor

AÇÃO DE COBRANÇA (procedimento comum)

em face de [NOME DO RÉU], [qualificação completa], inscrito(a) no CPF/CNPJ sob o nº [___], com endereço em [endereço completo], pelos fatos e fundamentos a seguir expostos.`,
      },
      {
        heading: "I — Dos fatos",
        body: `1. Em [data], as partes celebraram [contrato/negócio jurídico], por meio do qual o(a) Autor(a) [descrever a prestação cumprida].
2. Em contrapartida, o(a) Réu(é) obrigou-se ao pagamento de R$ [valor], com vencimento em [data].
3. Ocorre que, apesar de [notificações/cobranças/tentativas de composição — descrever], o débito permanece integralmente em aberto até a presente data, conforme documentos anexos (docs. [__]).`,
      },
      {
        heading: "II — Do direito",
        body: `4. O art. 389 do Código Civil estabelece que, não cumprida a obrigação, responde o devedor por perdas e danos, juros, atualização monetária e honorários advocatícios.
5. Tratando-se de obrigação positiva e líquida com termo certo, a mora é automática (CC, art. 397), incidindo juros e correção desde o vencimento.
6. Com a vigência da Lei 14.905/2024, a correção monetária observa o IPCA e os juros legais correspondem à taxa legal (Selic deduzido o IPCA), na forma do art. 406 do Código Civil.`,
      },
      {
        heading: "III — Dos pedidos",
        body: `Ante o exposto, requer:
a) a citação do(a) Réu(é), no endereço indicado, para responder aos termos da presente ação;
b) a procedência do pedido, condenando-se o(a) Réu(é) ao pagamento de R$ [valor], acrescido de correção monetária e juros na forma da lei, desde o vencimento;
c) a condenação do(a) Réu(é) ao pagamento das custas processuais e honorários advocatícios;
d) a produção de todos os meios de prova em direito admitidos, notadamente documental e testemunhal;
e) [manifesta/não manifesta] interesse na realização de audiência de conciliação ou mediação (CPC, art. 319, VII).

Dá-se à causa o valor de R$ [valor].`,
      },
      { heading: "Fecho", body: FECHO },
    ],
  },
  {
    slug: "contestacao-civel",
    title: "Contestação (procedimento comum)",
    category: "Cível",
    shortDescription:
      "Modelo de contestação com preliminares, prejudicial de prescrição, mérito e pedidos, atendendo ao ônus da impugnação específica.",
    metaDescription:
      "Modelo editável de contestação cível (CPC, arts. 335 a 342): preliminares, prescrição, impugnação específica dos fatos e pedidos finais.",
    keywords: ["modelo de contestação", "contestação cível CPC", "peça de defesa"],
    baseLegal: [
      "CPC, art. 335 — prazo de 15 dias úteis",
      "CPC, art. 337 — preliminares",
      "CPC, art. 341 — ônus da impugnação específica",
      "CPC, art. 336 — princípio da eventualidade",
    ],
    checklist: [
      "Conferir o termo inicial do prazo (art. 335, I a III)",
      "Alegar todas as preliminares do art. 337 sob pena de preclusão",
      "Impugnar especificamente cada fato da inicial",
      "Avaliar reconvenção, denunciação da lide ou chamamento ao processo",
      "Juntar procuração e documentos indispensáveis à defesa",
    ],
    sections: [
      {
        heading: "Endereçamento",
        body: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(ÍZA) DE DIREITO DA [nº] VARA CÍVEL DA COMARCA DE [Cidade/UF]

Processo nº [___]`,
      },
      {
        heading: "Preâmbulo",
        body: `[NOME DO RÉU], já qualificado(a) nos autos da ação [tipo] que lhe move [NOME DO AUTOR], vem, por seu(sua) advogado(a), tempestivamente, apresentar

CONTESTAÇÃO

pelas razões de fato e de direito a seguir aduzidas.`,
      },
      {
        heading: "I — Preliminares",
        body: `1. [Ex.: incompetência relativa/absoluta; inépcia da inicial; ilegitimidade passiva; falta de interesse processual; ausência de pressuposto processual] — CPC, art. 337, [inciso].
2. Fundamentar objetivamente e requerer a consequência processual pertinente (extinção sem resolução de mérito, remessa dos autos ao juízo competente etc.).`,
      },
      {
        heading: "II — Prejudicial de mérito: prescrição/decadência",
        body: `3. O direito perseguido está sujeito ao prazo de [__] anos (CC, art. [___]), cujo termo inicial ocorreu em [data]. Ajuizada a ação apenas em [data], impõe-se o reconhecimento da prescrição, com resolução do mérito (CPC, art. 487, II).`,
      },
      {
        heading: "III — Do mérito",
        body: `4. Impugnam-se especificamente os fatos narrados na inicial (CPC, art. 341): [rebater item a item].
5. [Fundamentação jurídica da defesa, com indicação de dispositivos legais e, se houver, precedentes vinculantes efetivamente verificados no processo].
6. Subsidiariamente, caso superadas as teses acima, requer-se [redução do valor, compensação, afastamento de juros/multa, reconhecimento de culpa concorrente etc.].`,
      },
      {
        heading: "IV — Dos pedidos",
        body: `Ante o exposto, requer:
a) o acolhimento das preliminares, com a extinção do feito sem resolução do mérito;
b) sucessivamente, o reconhecimento da prescrição;
c) no mérito, a total improcedência dos pedidos;
d) a condenação do(a) Autor(a) em custas e honorários advocatícios;
e) a produção de provas [documental, testemunhal, pericial], protestando pela juntada oportuna.`,
      },
      { heading: "Fecho", body: FECHO },
    ],
  },
  {
    slug: "reclamacao-trabalhista",
    title: "Reclamação trabalhista",
    category: "Trabalhista",
    shortDescription:
      "Modelo de reclamação trabalhista com narrativa do vínculo, pedidos líquidos e requerimentos processuais próprios da CLT.",
    metaDescription:
      "Modelo editável de reclamação trabalhista com pedidos líquidos (CLT, art. 840, §1º), verbas rescisórias, horas extras e requerimentos processuais.",
    keywords: ["modelo reclamação trabalhista", "petição inicial trabalhista", "pedidos líquidos CLT"],
    baseLegal: [
      "CLT, art. 840, §1º — pedido certo, determinado e com indicação de valor",
      "CLT, arts. 477 e 467 — verbas rescisórias e multa",
      "CLT, art. 59 — horas extras",
      "Lei 13.467/2017 — reforma trabalhista",
    ],
    checklist: [
      "CTPS, contrato, holerites, cartões de ponto e TRCT",
      "Cálculo individualizado de cada pedido (valor por verba)",
      "Definição do rito (sumaríssimo até 40 salários mínimos)",
      "Pedido de justiça gratuita com declaração de hipossuficiência",
      "Atenção aos honorários de sucumbência recíproca",
    ],
    sections: [
      {
        heading: "Endereçamento",
        body: `EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(ÍZA) DO TRABALHO DA [nº] VARA DO TRABALHO DE [Cidade/UF]`,
      },
      {
        heading: "Qualificação",
        body: `[NOME DO RECLAMANTE], [nacionalidade], [estado civil], [função], CPF nº [___], CTPS nº [___], residente na [endereço], vem, por seu(sua) advogado(a), propor

RECLAMAÇÃO TRABALHISTA — rito [ordinário/sumaríssimo]

em face de [NOME DA RECLAMADA], CNPJ nº [___], com sede em [endereço].`,
      },
      {
        heading: "I — Do contrato de trabalho",
        body: `1. O(A) Reclamante foi admitido(a) em [data], na função de [___], mediante última remuneração de R$ [valor], com jornada contratual de [___].
2. O contrato foi encerrado em [data], por [modalidade de rescisão].`,
      },
      {
        heading: "II — Das irregularidades",
        body: `3. [Ex.: horas extras habituais não pagas — descrever jornada real e comparar com a contratual].
4. [Ex.: ausência de pagamento das verbas rescisórias no prazo do art. 477, §6º, da CLT, ensejando a multa do §8º].
5. [Ex.: FGTS não recolhido; intervalos suprimidos; acúmulo de função; adicional de insalubridade/periculosidade].`,
      },
      {
        heading: "III — Dos pedidos (com valores)",
        body: `Requer a condenação da Reclamada ao pagamento de:
a) aviso prévio — R$ [__];
b) férias proporcionais + 1/3 — R$ [__];
c) 13º salário proporcional — R$ [__];
d) FGTS + multa de 40% — R$ [__];
e) horas extras e reflexos — R$ [__];
f) multa do art. 477, §8º, da CLT — R$ [__];
g) honorários advocatícios de sucumbência;
h) juros e correção monetária na forma da lei.

Valor total da causa: R$ [__].`,
      },
      {
        heading: "IV — Requerimentos",
        body: `Requer a notificação da Reclamada, a concessão dos benefícios da justiça gratuita (CLT, art. 790, §3º), a produção de prova documental, testemunhal e pericial, e a expedição de ofícios a [órgãos], se necessário.`,
      },
      { heading: "Fecho", body: FECHO },
    ],
  },
  {
    slug: "notificacao-extrajudicial",
    title: "Notificação extrajudicial",
    category: "Extrajudicial",
    shortDescription:
      "Modelo de notificação extrajudicial para constituir o devedor em mora ou exigir cumprimento de obrigação antes da via judicial.",
    metaDescription:
      "Modelo editável de notificação extrajudicial para constituição em mora, com prazo para cumprimento e advertência sobre medidas judiciais.",
    keywords: ["modelo notificação extrajudicial", "constituição em mora", "notificação de cobrança"],
    baseLegal: [
      "Código Civil, art. 397, parágrafo único — mora mediante interpelação",
      "Código Civil, art. 473 — resilição unilateral mediante denúncia",
      "Lei 6.015/1973, art. 160 — notificação por cartório de títulos e documentos",
    ],
    checklist: [
      "Escolher meio com prova de recebimento (AR, cartório de RTD ou e-mail com confirmação)",
      "Descrever a obrigação e o prazo de cumprimento com clareza",
      "Evitar ameaça que extrapole o exercício regular de direito",
      "Guardar comprovante de envio e recebimento",
    ],
    sections: [
      {
        heading: "Cabeçalho",
        body: `NOTIFICAÇÃO EXTRAJUDICIAL

Notificante: [nome/razão social], CPF/CNPJ [___], endereço [___].
Notificado: [nome/razão social], CPF/CNPJ [___], endereço [___].
Assunto: [ex.: constituição em mora e exigência de pagamento].`,
      },
      {
        heading: "Corpo",
        body: `Prezado(a) Senhor(a),

Na qualidade de [credor/contratante], venho, por meio desta, NOTIFICÁ-LO(A) dos fatos a seguir:

1. Em [data], as partes celebraram [contrato/negócio], mediante o qual V.Sa. obrigou-se a [descrever a obrigação], com vencimento em [data].
2. Até a presente data, a obrigação permanece descumprida, no valor atualizado de R$ [___].
3. Assim, fica V.Sa. NOTIFICADO(A) a [pagar/cumprir a obrigação] no prazo de [__] ([__]) dias corridos, contados do recebimento desta, mediante [forma de pagamento/dados bancários].
4. Decorrido o prazo sem manifestação, a presente notificação servirá para constituir V.Sa. em mora, autorizando a adoção das medidas judiciais cabíveis, com acréscimo de correção monetária, juros, custas e honorários advocatícios.

Sendo o que se apresenta para o momento, reiteramos votos de consideração.`,
      },
      {
        heading: "Fecho",
        body: `[Cidade/UF], [data].

[Nome do notificante ou do(a) advogado(a)]
[CPF/CNPJ ou OAB/[UF] nº ___]`,
      },
    ],
  },
  {
    slug: "procuracao-ad-judicia",
    title: "Procuração ad judicia et extra",
    category: "Extrajudicial",
    shortDescription:
      "Modelo de procuração com poderes gerais da cláusula ad judicia e poderes especiais expressos.",
    metaDescription:
      "Modelo editável de procuração ad judicia et extra com poderes especiais (CPC, art. 105) para representação judicial e extrajudicial.",
    keywords: ["modelo de procuração", "procuração ad judicia", "poderes especiais CPC 105"],
    baseLegal: [
      "CPC, art. 105 — poderes gerais e especiais",
      "CPC, art. 287 — juntada da procuração com a inicial",
      "EOAB, art. 5º — representação do cliente",
    ],
    checklist: [
      "Qualificação completa do outorgante (CPC, art. 287)",
      "Poderes especiais expressos quando houver transação ou renúncia",
      "Indicar sociedade de advogados, se houver",
      "Data e assinatura (física ou eletrônica com certificado válido)",
    ],
    sections: [
      {
        heading: "Outorgante",
        body: `OUTORGANTE: [nome], [nacionalidade], [estado civil], [profissão], CPF nº [___], RG nº [___], residente e domiciliado(a) na [endereço completo], e-mail [___].`,
      },
      {
        heading: "Outorgado",
        body: `OUTORGADO(A): [nome do(a) advogado(a)], inscrito(a) na OAB/[UF] sob o nº [___], com escritório profissional na [endereço], e-mail [___].`,
      },
      {
        heading: "Poderes",
        body: `PODERES: pela presente, o(a) outorgante nomeia e constitui seu(sua) bastante procurador(a) o(a) outorgado(a), conferindo-lhe os poderes da cláusula ad judicia et extra, para o foro em geral, em qualquer juízo, instância ou tribunal, podendo propor as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras até final decisão, usando os recursos legais e acompanhando-os.

Ficam ainda conferidos os poderes especiais para receber citação, confessar, reconhecer a procedência do pedido, transigir, desistir, renunciar ao direito sobre o qual se funda a ação, receber, dar quitação, firmar compromisso e assinar declaração de hipossuficiência econômica (CPC, art. 105), podendo substabelecer, com ou sem reserva de poderes.`,
      },
      {
        heading: "Fecho",
        body: `[Cidade/UF], [data].

_______________________________
[Nome do outorgante]`,
      },
    ],
  },
  {
    slug: "recurso-apelacao",
    title: "Recurso de apelação",
    category: "Recursos",
    shortDescription:
      "Modelo de apelação com petição de interposição e razões recursais separadas, conforme o CPC.",
    metaDescription:
      "Modelo editável de recurso de apelação (CPC, arts. 1.009 a 1.014): interposição, razões, preliminares e pedido de reforma.",
    keywords: ["modelo de apelação", "razões de apelação", "recurso CPC 1009"],
    baseLegal: [
      "CPC, art. 1.009 — cabimento da apelação",
      "CPC, art. 1.003, §5º — prazo de 15 dias úteis",
      "CPC, art. 1.010 — requisitos das razões",
      "CPC, art. 1.007 — preparo",
    ],
    checklist: [
      "Comprovante de preparo ou pedido de gratuidade",
      "Delimitar capítulos da sentença impugnados",
      "Impugnação específica dos fundamentos da sentença (art. 1.010, II e III)",
      "Verificar efeito suspensivo e hipóteses do art. 1.012, §1º",
      "Prequestionar dispositivos para recursos superiores",
    ],
    sections: [
      {
        heading: "Petição de interposição",
        body: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(ÍZA) DE DIREITO DA [nº] VARA CÍVEL DA COMARCA DE [Cidade/UF]

Processo nº [___]

[NOME DO APELANTE], já qualificado(a) nos autos, inconformado(a) com a r. sentença de [data] (ID [__]), vem, tempestivamente, com fundamento no art. 1.009 do CPC, interpor

RECURSO DE APELAÇÃO

requerendo o recebimento e o processamento nos efeitos legais, com posterior remessa ao Egrégio Tribunal [___], conforme razões anexas. Comprovante de preparo em anexo.`,
      },
      {
        heading: "Razões — síntese da demanda",
        body: `EGRÉGIO TRIBUNAL,
COLENDA CÂMARA,
ÍNCLITOS JULGADORES,

1. Trata-se de ação [tipo], na qual o(a) Apelante postulou [___]. A r. sentença julgou [procedente/improcedente] o pedido, sob o fundamento de que [___].`,
      },
      {
        heading: "Razões — do mérito recursal",
        body: `2. A r. sentença merece reforma porque [expor o erro de fato ou de direito, indicando o dispositivo violado].
3. [Demonstrar a prova dos autos que contraria a conclusão adotada, com referência a IDs/folhas].
4. Para fins de prequestionamento, tem-se por violados os arts. [___], que devem ser expressamente apreciados.`,
      },
      {
        heading: "Pedido",
        body: `Ante o exposto, requer o conhecimento e o provimento do recurso, para reformar integralmente a r. sentença e [julgar procedentes os pedidos / julgar improcedentes os pedidos], invertendo-se os ônus sucumbenciais.

Subsidiariamente, requer a anulação da sentença por [vício], com retorno dos autos à origem.`,
      },
      { heading: "Fecho", body: FECHO },
    ],
  },
  {
    slug: "contrato-prestacao-servicos-advocaticios",
    title: "Contrato de honorários advocatícios",
    category: "Contratos",
    shortDescription:
      "Modelo de contrato de prestação de serviços advocatícios com honorários fixos, êxito e cláusulas de rescisão.",
    metaDescription:
      "Modelo editável de contrato de honorários advocatícios: objeto, honorários fixos e de êxito, despesas, rescisão e foro.",
    keywords: ["contrato de honorários advocatícios", "modelo contrato advogado", "honorários de êxito"],
    baseLegal: [
      "Lei 8.906/1994 (EOAB), arts. 22 a 26 — honorários",
      "Código de Ética e Disciplina da OAB — arts. 48 a 54",
      "Código Civil, arts. 593 e ss. — prestação de serviços",
    ],
    checklist: [
      "Delimitar o objeto e as instâncias abrangidas",
      "Separar honorários contratuais dos sucumbenciais",
      "Prever reembolso de custas e despesas",
      "Definir consequências da revogação do mandato",
      "Observar a tabela mínima da Seccional da OAB",
    ],
    sections: [
      {
        heading: "Partes",
        body: `CONTRATANTE: [nome], CPF/CNPJ [___], endereço [___].
CONTRATADO(A): [nome do(a) advogado(a) ou sociedade], OAB/[UF] nº [___] ou CNPJ [___], endereço [___].`,
      },
      {
        heading: "Cláusula 1ª — Objeto",
        body: `O(A) Contratado(a) prestará serviços advocatícios consistentes em [descrever: propositura/defesa em ação ___, atuação em [instâncias], consultoria em ___], com atuação limitada ao objeto ora descrito.`,
      },
      {
        heading: "Cláusula 2ª — Honorários",
        body: `2.1. Honorários fixos: R$ [valor], pagos em [__] parcelas de R$ [__], vencendo a primeira em [data].
2.2. Honorários de êxito: [__]% sobre o proveito econômico efetivamente obtido, devidos na data do levantamento/recebimento.
2.3. Os honorários de sucumbência pertencem ao(à) Contratado(a), nos termos do art. 23 do EOAB.
2.4. Em caso de atraso, incidirá multa de 2% e juros de mora na forma da lei, com correção pelo IPCA.`,
      },
      {
        heading: "Cláusula 3ª — Despesas",
        body: `Custas, taxas, diligências, honorários periciais e deslocamentos correm por conta do(a) Contratante, mediante prévio aviso e comprovação.`,
      },
      {
        heading: "Cláusula 4ª — Vigência e rescisão",
        body: `4.1. O contrato vigora até o trânsito em julgado do processo ou a conclusão do serviço contratado.
4.2. A revogação do mandato antes do término não afasta o pagamento dos honorários proporcionais ao trabalho já realizado.
4.3. A renúncia observará o art. 5º, §3º, do EOAB.`,
      },
      {
        heading: "Cláusula 5ª — Foro",
        body: `Fica eleito o foro da Comarca de [Cidade/UF] para dirimir controvérsias.

[Cidade/UF], [data].

_____________________          _____________________
Contratante                     Contratado(a)`,
      },
    ],
  },
  {
    slug: "acordo-extrajudicial-homologacao",
    title: "Acordo extrajudicial com pedido de homologação",
    category: "Extrajudicial",
    shortDescription:
      "Modelo de acordo firmado entre as partes com petição conjunta de homologação judicial.",
    metaDescription:
      "Modelo editável de acordo extrajudicial com petição conjunta de homologação judicial (CPC, arts. 515, III, e 725, VIII).",
    keywords: ["modelo de acordo extrajudicial", "homologação de acordo", "petição conjunta"],
    baseLegal: [
      "CPC, art. 515, III — acordo homologado como título executivo judicial",
      "CPC, art. 725, VIII — homologação de autocomposição extrajudicial",
      "Código Civil, art. 840 — transação",
    ],
    checklist: [
      "Objeto do acordo descrito com precisão e valores",
      "Forma, prazo e dados de pagamento",
      "Cláusula penal em caso de descumprimento",
      "Quitação e alcance (total ou parcial)",
      "Assinatura das partes e dos advogados",
    ],
    sections: [
      {
        heading: "Petição conjunta",
        body: `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(ÍZA) DE DIREITO DA [nº] VARA [___] DA COMARCA DE [Cidade/UF]

[Processo nº ___ , se houver]

[PARTE A] e [PARTE B], já qualificadas, por seus advogados, vêm requerer a HOMOLOGAÇÃO do acordo a seguir transcrito, nos termos dos arts. 515, III, e 725, VIII, do CPC.`,
      },
      {
        heading: "Cláusulas do acordo",
        body: `1. OBJETO: as partes transigem quanto a [descrever a controvérsia], pondo fim ao litígio.
2. VALOR: [PARTE B] pagará a [PARTE A] a quantia de R$ [valor], em [__] parcelas de R$ [__], vencendo a primeira em [data], mediante depósito na conta [banco/agência/conta/PIX].
3. INADIMPLEMENTO: o atraso implica vencimento antecipado do saldo, multa de [__]% e juros de mora na forma da lei.
4. QUITAÇÃO: cumprido integralmente o acordo, as partes outorgam quitação [plena e geral / limitada ao objeto], nada mais podendo reclamar.
5. CUSTAS E HONORÁRIOS: [definir a responsabilidade; cada parte arca com os honorários de seu patrono, salvo disposição diversa].`,
      },
      {
        heading: "Pedido",
        body: `Requerem a homologação do acordo, com a consequente extinção do processo com resolução do mérito (CPC, art. 487, III, "b"), e a suspensão do feito até o cumprimento integral, se for o caso.

[Cidade/UF], [data].

_____________________          _____________________
Advogado(a) da Parte A          Advogado(a) da Parte B
OAB/[UF] nº [___]               OAB/[UF] nº [___]`,
      },
    ],
  },
];

export const MINUTA_CATEGORIES = Array.from(new Set(MINUTAS.map((m) => m.category)));

export function getMinuta(slug?: string) {
  return MINUTAS.find((m) => m.slug === slug);
}

export function minutaToPlainText(m: Minuta) {
  return [`${m.title.toUpperCase()}\n`, ...m.sections.map((s) => `${s.heading}\n\n${s.body}\n`)].join("\n");
}
