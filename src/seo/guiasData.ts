// Gerado a partir do texto aprovado pelo usuário. Não altere o conteúdo jurídico.
// TypeScript puro: consumido pela página, por routeMeta e por routeContent.

import type { GuiaData } from "./guiasTypes";

export const GUIAS: GuiaData[] = [
  {
    "path": "/guias/taxa-legal-lei-14905-como-calcular-juros",
    "title": "Taxa legal da Lei 14.905/2024: como calcular os juros",
    "description": "Como calcular juros pela taxa legal do art. 406 do Código Civil: Selic menos inflação, piso zero, juros simples e exemplo numérico.",
    "h1": "Como calcular juros pela taxa legal da Lei 14.905/2024",
    "resposta": "Desde 30 de agosto de 2024, os juros não convencionados seguem a taxa legal do art. 406 do Código Civil: a Selic deduzida da inflação, com piso zero. O Banco Central divulga a taxa mês a mês, conforme a Resolução CMN 5.171/2024. Para calcular, some as taxas mensais do período, em juros simples, e aplique sobre o valor já corrigido.",
    "sections": [
      {
        "heading": "O que diz a lei",
        "markdown": "A Lei 14.905/2024 deu nova redação ao art. 406 do Código Civil. Quando os juros não forem convencionados, quando forem convencionados sem taxa estipulada ou quando decorrerem de lei, eles seguem a taxa legal (art. 406, caput).\n\n- **Composição:** a taxa legal corresponde à Selic, deduzido o índice de atualização monetária do art. 389, parágrafo único, ou seja, o IPCA (art. 406, § 1º).\n- **Metodologia:** o Conselho Monetário Nacional define o cálculo e o Banco Central divulga a taxa (art. 406, § 2º).\n- **Piso zero:** se o resultado for negativo, considera-se zero no período (art. 406, § 3º).\n\nA lei foi publicada no DOU de 1º de julho de 2024 e, nessa parte, produz efeitos 60 dias depois da publicação (art. 5º, II, da Lei 14.905/2024). Por isso o marco usado pelo Banco Central e pelo STJ é 30 de agosto de 2024."
      },
      {
        "heading": "Como o Banco Central calcula a taxa legal",
        "markdown": "A Resolução CMN 5.171/2024 fixou a fórmula:\n\n- Para cada mês de referência, a taxa legal é o maior valor entre zero e (Fator Selic / Fator IPCA - 1), expresso em percentual com seis casas decimais (art. 2º).\n- O Fator Selic acumula a Selic diária do mês anterior ao de referência (arts. 2º, II, e 3º).\n- O Fator IPCA usa a variação do **IPCA-15** do mês anterior ao de referência (arts. 2º, III, e 5º).\n- A acumulação entre meses é por **juros simples**, e a fração de mês é calculada pro rata pelos dias corridos (art. 6º).\n- Se houver atualização monetária, os juros incidem sobre o valor já atualizado (art. 7º).\n\nNa prática, você não precisa refazer a fórmula: o Banco Central publica a taxa mensal pronta (série 29543 do SGS)."
      },
      {
        "heading": "Passo a passo",
        "markdown": "1. Confirme que não há taxa de juros pactuada nem lei específica para o caso.\n2. Defina o termo inicial dos juros (veja o guia sobre [termo inicial de correção e juros](/guias/termo-inicial-correcao-monetaria-e-juros)).\n3. Corrija o valor pelo índice aplicável, em regra o IPCA (veja [IPCA ou INPC](/guias/correcao-monetaria-ipca-ou-inpc)).\n4. Some as taxas legais mensais do período. Nos meses incompletos, use a fração pro rata dos dias.\n5. Aplique a soma sobre o valor corrigido."
      },
      {
        "heading": "Exemplo",
        "markdown": "*Exemplo ilustrativo, sem correção monetária, para mostrar só os juros.* Dívida de R$ 10.000,00, juros pela taxa legal de 1º de janeiro a 30 de junho de 2025. Taxas mensais divulgadas pelo Banco Central (SGS 29543):\n\n| Mês | Taxa legal |\n|---|---|\n| 01/2025 | 0,589427% |\n| 02/2025 | 0,902209% |\n| 03/2025 | 0,000000% (resultado negativo, piso zero) |\n| 04/2025 | 0,321969% |\n| 05/2025 | 0,623200% |\n| 06/2025 | 0,775982% |\n| **Soma** | **3,212787%** |\n\nJuros: R$ 10.000,00 x 3,212787% = **R$ 321,28**.\n\nEm um caso real, os juros incidem sobre o valor corrigido pelo IPCA (art. 7º da Resolução CMN 5.171/2024), e o cálculo muda mês a mês. A [calculadora de correção monetária e juros](/calculadoras/correcao-monetaria-juros-lei-14905) faz isso com a memória de cálculo completa."
      },
      {
        "heading": "Quando a taxa legal não se aplica",
        "markdown": "- **Juros convencionados:** se o contrato fixou a taxa, vale o contrato (art. 406, caput).\n- **Período anterior a 30/08/2024:** o STJ fixou que, antes da Lei 14.905/2024, a taxa do art. 406 era a Selic (Tema 1.368, REsp 2.199.164/PR, Corte Especial). Nesse período, a Selic engloba juros e correção e não se cumula com outro índice.\n- **Lei específica:** regimes próprios, como as condenações da Fazenda Pública (art. 3º da EC 113/2021, alterado pela EC 136/2025), seguem a sua própria regra."
      },
      {
        "heading": "Base legal",
        "markdown": "Código Civil, arts. 389, parágrafo único, e 406, §§ 1º a 3º (redação da Lei 14.905/2024); Lei 14.905/2024, art. 5º; Resolução CMN 5.171/2024, arts. 2º a 8º; STJ, Tema 1.368."
      }
    ],
    "faq": [
      {
        "question": "A taxa legal é juros compostos?",
        "answer": "Não. A Resolução CMN 5.171/2024 determina juros simples na acumulação das taxas mensais e na fração pro rata (art. 6º)."
      },
      {
        "question": "Por que a taxa legal de alguns meses é zero?",
        "answer": "Quando a inflação supera a Selic do período, o resultado é negativo. O art. 406, § 3º, do Código Civil manda considerar zero."
      },
      {
        "question": "Onde encontro a taxa legal oficial de cada mês?",
        "answer": "O Banco Central divulga a taxa legal mensal (Resolução CMN 5.171/2024, art. 8º), na série 29543 do SGS e na Calculadora do Cidadão."
      },
      {
        "question": "A taxa legal vale para dívidas anteriores à lei?",
        "answer": "Para os períodos a partir de 30/08/2024, sim, se não houver taxa pactuada. Para o período anterior, o STJ aplica a Selic (Tema 1.368)."
      },
      {
        "question": "Posso aplicar 1% ao mês?",
        "answer": "Só se a taxa tiver sido convencionada pelas partes. Na falta de taxa pactuada, vale a taxa legal do art. 406. Se a sentença já fixou outro critério, analise o título antes de calcular."
      }
    ],
    "cta": {
      "links": [
        {
          "label": "Calcular correção e juros pela taxa legal",
          "to": "/calculadoras/correcao-monetaria-juros-lei-14905"
        },
        {
          "label": "Taxa legal mês a mês",
          "to": "/calculadoras/correcao-monetaria-juros-lei-14905/taxa-legal"
        }
      ],
      "plano": "No plano pago, a IA do Honorífico analisa o caso e redige a petição com o cálculo anexado.",
      "related": [
        {
          "label": "Correção monetária em ação cível: IPCA ou INPC?",
          "to": "/guias/correcao-monetaria-ipca-ou-inpc"
        },
        {
          "label": "A partir de quando corrigir uma dívida judicial",
          "to": "/guias/termo-inicial-correcao-monetaria-e-juros"
        },
        {
          "label": "Todas as calculadoras",
          "to": "/calculadoras"
        }
      ],
      "aviso": "Conteúdo informativo, atualizado em novembro de 2026. Não substitui a análise de um advogado sobre o caso concreto."
    }
  },
  {
    "path": "/guias/correcao-monetaria-ipca-ou-inpc",
    "title": "Correção monetária em ação cível: IPCA ou INPC?",
    "description": "Desde a Lei 14.905/2024, o IPCA é o índice padrão do art. 389 do Código Civil. Veja a transição, as exceções e um exemplo IPCA x INPC.",
    "h1": "Correção monetária em ação cível: IPCA ou INPC?",
    "resposta": "Pela regra atual, o IPCA. Desde 30 de agosto de 2024, o art. 389, parágrafo único, do Código Civil manda aplicar o IPCA quando o índice de correção não foi convencionado nem está previsto em lei específica. O INPC ou outro índice só se aplica se o contrato, uma lei específica ou o título judicial o determinar.",
    "sections": [
      {
        "heading": "O que mudou com a Lei 14.905/2024",
        "markdown": "Antes da Lei 14.905/2024, o Código Civil não indicava um índice de correção monetária. A lei incluiu o parágrafo único no art. 389: na falta de índice convencionado ou previsto em lei específica, aplica-se a variação do IPCA, apurado e divulgado pelo IBGE, ou o índice que vier a substituí-lo.\n\nA mesma lei separou correção e juros. A correção segue o IPCA (art. 389, parágrafo único), e os juros seguem a taxa legal, que é a Selic deduzida da inflação (art. 406, § 1º). Os arts. 395 e 404 também passaram a prever, de forma expressa, juros e atualização monetária nas perdas e danos."
      },
      {
        "heading": "A transição: antes e depois de 30/08/2024",
        "markdown": "A Lei 14.905/2024 foi publicada em 1º de julho de 2024, e as regras dos arts. 389 e 406 produzem efeitos 60 dias depois (art. 5º, II). O STJ divide o cálculo em dois períodos:\n\n- **Até 29/08/2024:** vale o Tema 1.368 (REsp 2.199.164/PR, Corte Especial). A taxa de juros de mora do art. 406, na redação antiga, é a Selic. Como a Selic já engloba juros e correção, ela não se cumula com outro índice de correção no período em que incide.\n- **A partir de 30/08/2024:** correção pelo IPCA e juros pela taxa legal, sem cumulação entre índices (STJ, REsp 2.157.983/SP, rel. Min. Moura Ribeiro).\n\nNa prática, um mesmo débito pode ter um trecho calculado pela Selic e outro pelo IPCA mais a taxa legal. A [calculadora do Honorífico](/calculadoras/correcao-monetaria-juros-lei-14905) faz esse corte na data."
      },
      {
        "heading": "Quando vale outro índice",
        "markdown": "O IPCA é a regra supletiva, ou seja, só entra quando não há outro critério. Outro índice se aplica quando:\n\n- **Há índice convencionado:** se o contrato elegeu o INPC, o IGP-M ou outro índice, vale o contrato (art. 389, parágrafo único).\n- **Há lei específica:** quando uma lei fixa índice próprio, ela prevalece. Por exemplo, as condenações da Fazenda Pública seguem regra constitucional própria (art. 3º da EC 113/2021, alterado pela EC 136/2025).\n- **O título judicial já fixou o índice:** se a sentença definiu o critério de correção, comece pelo que ela diz. Se quiser discutir a aplicação da nova lei, isso deve ser feito no processo."
      },
      {
        "heading": "Exemplo: IPCA x INPC",
        "markdown": "*Exemplo ilustrativo.* Valor de R$ 10.000,00 corrigido pelos índices mensais de janeiro a junho de 2025 (séries do Banco Central: IPCA, SGS 433; INPC, SGS 188).\n\n| Mês | IPCA | INPC |\n|---|---|---|\n| 01/2025 | 0,16% | 0,00% |\n| 02/2025 | 1,31% | 1,48% |\n| 03/2025 | 0,56% | 0,51% |\n| 04/2025 | 0,43% | 0,48% |\n| 05/2025 | 0,26% | 0,35% |\n| 06/2025 | 0,24% | 0,23% |\n| **Valor corrigido** | **R$ 10.299,21** | **R$ 10.308,24** |\n\nA correção monetária é composta: cada índice mensal incide sobre o saldo do mês anterior. Neste intervalo curto, a diferença é de R$ 9,03, mas ela pode crescer em períodos longos e mudar de sinal conforme o mês. Para o seu caso, use a [calculadora pelo IPCA](/calculadoras/correcao-monetaria-juros-lei-14905/ipca) ou a [calculadora pelo INPC](/calculadoras/correcao-monetaria-juros-lei-14905/inpc), se o INPC tiver sido pactuado."
      },
      {
        "heading": "Base legal",
        "markdown": "Código Civil, arts. 389, parágrafo único, 395, 404 e 406, § 1º (redação da Lei 14.905/2024); Lei 14.905/2024, art. 5º; EC 113/2021, art. 3º; STJ, Tema 1.368 (REsp 2.199.164/PR) e REsp 2.157.983/SP."
      }
    ],
    "faq": [
      {
        "question": "Qual índice de correção usar em ação cível sem índice no contrato?",
        "answer": "O IPCA, para os períodos a partir de 30/08/2024 (art. 389, parágrafo único, do Código Civil), salvo lei específica ou critério fixado no título judicial."
      },
      {
        "question": "O INPC ainda pode ser usado?",
        "answer": "Sim, quando foi convencionado pelas partes, quando uma lei específica o prevê ou quando o título judicial o fixou."
      },
      {
        "question": "Posso somar IPCA e Selic?",
        "answer": "Não no mesmo período. Até 29/08/2024, a Selic já inclui a correção (STJ, Tema 1.368). Depois, a correção é pelo IPCA e os juros pela taxa legal, que já desconta a inflação."
      },
      {
        "question": "O que é o \"índice que vier a substituí-lo\"?",
        "answer": "O art. 389, parágrafo único, prevê que, se o IPCA deixar de existir, vale o índice que o substituir oficialmente."
      }
    ],
    "cta": {
      "links": [
        {
          "label": "Calcular correção monetária e juros",
          "to": "/calculadoras/correcao-monetaria-juros-lei-14905"
        }
      ],
      "plano": "No plano pago, a IA do Honorífico analisa o caso e redige a petição com o cálculo anexado.",
      "related": [
        {
          "label": "Como calcular juros pela taxa legal da Lei 14.905/2024",
          "to": "/guias/taxa-legal-lei-14905-como-calcular-juros"
        },
        {
          "label": "A partir de quando corrigir uma dívida judicial",
          "to": "/guias/termo-inicial-correcao-monetaria-e-juros"
        },
        {
          "label": "Todas as calculadoras",
          "to": "/calculadoras"
        }
      ],
      "aviso": "Conteúdo informativo, atualizado em novembro de 2026. Não substitui a análise de um advogado sobre o caso concreto."
    }
  },
  {
    "path": "/guias/termo-inicial-correcao-monetaria-e-juros",
    "title": "Termo inicial de correção e juros: Súmulas 43, 54 e 362",
    "description": "A partir de quando correm correção monetária e juros de mora: Súmulas 43, 54 e 362 do STJ e arts. 397, 398 e 405 do Código Civil.",
    "h1": "A partir de quando corrigir uma dívida judicial: termo inicial de correção e juros",
    "resposta": "Depende da verba e da origem da dívida. A correção do dano material corre desde o efetivo prejuízo (Súmula 43 do STJ); a do dano moral, desde o arbitramento (Súmula 362). Os juros correm do evento danoso na responsabilidade extracontratual (Súmula 54; art. 398 do Código Civil) e, na contratual, da citação (art. 405) ou do vencimento (art. 397).",
    "sections": [
      {
        "heading": "Correção monetária e juros têm termos diferentes",
        "markdown": "A correção monetária só recompõe o valor da moeda, e por isso começa quando o valor passou a ser devido. Os juros de mora remuneram o atraso e começam quando o devedor entra em mora. Por isso, a mesma condenação pode ter uma data para a correção e outra para os juros."
      },
      {
        "heading": "Correção monetária: desde quando",
        "markdown": "- **Dano material por ato ilícito:** desde a data do efetivo prejuízo. Súmula 43 do STJ: \"Incide correção monetária sobre dívida por ato ilícito a partir da data do efetivo prejuízo.\"\n- **Dano moral:** desde a data do arbitramento, ou seja, da decisão que fixou o valor. Súmula 362 do STJ: \"A correção monetária do valor da indenização do dano moral incide desde a data do arbitramento.\"\n- **Obrigação com vencimento certo** (parcela, aluguel, boleto): em regra, desde cada vencimento. Confira sempre o que o contrato e o título judicial dizem."
      },
      {
        "heading": "Juros de mora: desde quando",
        "markdown": "- **Responsabilidade extracontratual** (acidente, ato ilícito sem contrato entre as partes): desde o evento danoso. Súmula 54 do STJ: \"Os juros moratórios fluem a partir do evento danoso, em caso de responsabilidade extracontratual.\" No mesmo sentido, o art. 398 do Código Civil diz que, nas obrigações provenientes de ato ilícito, o devedor está em mora desde que o praticou.\n- **Obrigação positiva e líquida, com termo:** desde o vencimento. O inadimplemento no termo constitui o devedor em mora de pleno direito (art. 397, caput). Sem termo, a mora depende de interpelação judicial ou extrajudicial (art. 397, parágrafo único).\n- **Demais casos de responsabilidade contratual:** desde a citação. Art. 405 do Código Civil: \"Contam-se os juros de mora desde a citação inicial.\""
      },
      {
        "heading": "Resumo",
        "markdown": "| Situação | Correção desde | Juros desde |\n|---|---|---|\n| Dano material, extracontratual | Efetivo prejuízo (Súmula 43) | Evento danoso (Súmula 54; art. 398) |\n| Dano moral, extracontratual | Arbitramento (Súmula 362) | Evento danoso (Súmula 54; art. 398) |\n| Dívida líquida com vencimento | Vencimento | Vencimento (art. 397) |\n| Outras obrigações contratuais | Conforme o título | Citação (art. 405) |"
      },
      {
        "heading": "Erros comuns",
        "markdown": "- **Usar a data da sentença para tudo:** só a correção do dano moral começa no arbitramento. O dano material e os juros têm outros termos.\n- **Contar juros da citação em caso de ato ilícito:** na responsabilidade extracontratual, a regra é o evento danoso (Súmula 54).\n- **Esquecer o termo de cada verba:** em uma mesma condenação, lance cada verba separadamente, com a sua data."
      },
      {
        "heading": "Exemplo",
        "markdown": "*Exemplo ilustrativo de datas, sem valores.* Em 10/03/2025, um carro é atingido por outro em um acidente, sem contrato entre as partes. O dono paga o conserto em 20/03/2025. A sentença, de 15/09/2025, condena o réu a pagar o conserto e uma indenização por dano moral.\n\n- **Conserto (dano material):** correção desde 20/03/2025, o efetivo prejuízo (Súmula 43), e juros desde 10/03/2025, o evento danoso (Súmula 54).\n- **Dano moral:** correção desde 15/09/2025, o arbitramento (Súmula 362), e juros desde 10/03/2025 (Súmula 54).\n\nCom as datas definidas, falta escolher o índice e a taxa de cada período. Para períodos a partir de 30/08/2024, a regra é o IPCA na correção e a taxa legal nos juros, salvo critério próprio no contrato, em lei ou no título (veja [IPCA ou INPC](/guias/correcao-monetaria-ipca-ou-inpc) e [como calcular a taxa legal](/guias/taxa-legal-lei-14905-como-calcular-juros)). Lance cada verba com a sua data na [calculadora de correção monetária e juros](/calculadoras/correcao-monetaria-juros-lei-14905)."
      },
      {
        "heading": "Base legal",
        "markdown": "Código Civil, arts. 397, 398 e 405; Súmulas 43, 54 e 362 do STJ. Para índice e taxa: Código Civil, arts. 389, parágrafo único, e 406 (redação da Lei 14.905/2024)."
      }
    ],
    "faq": [
      {
        "question": "Os juros do dano moral correm desde o arbitramento?",
        "answer": "Não pela Súmula 362, que trata só da correção. Na responsabilidade extracontratual, os juros correm desde o evento danoso (Súmula 54). Na contratual, a regra geral é a citação (art. 405)."
      },
      {
        "question": "Qual a diferença entre responsabilidade contratual e extracontratual para os juros?",
        "answer": "Na extracontratual, o devedor está em mora desde o ato ilícito (art. 398 e Súmula 54). Na contratual, a mora começa no vencimento da obrigação líquida (art. 397) ou, nos demais casos, na citação (art. 405)."
      },
      {
        "question": "Se a sentença fixou outra data, qual vale?",
        "answer": "Comece pelo que o título judicial determina. As súmulas orientam a fixação, mas o cálculo do cumprimento de sentença deve seguir a decisão."
      },
      {
        "question": "A Lei 14.905/2024 mudou o termo inicial?",
        "answer": "Não. Ela mudou o índice de correção (art. 389, parágrafo único) e a taxa de juros (art. 406). O art. 405 e as súmulas sobre o termo inicial continuam os mesmos."
      }
    ],
    "cta": {
      "links": [
        {
          "label": "Calcular correção monetária e juros",
          "to": "/calculadoras/correcao-monetaria-juros-lei-14905"
        }
      ],
      "plano": "No plano pago, a IA do Honorífico analisa o caso e redige a petição com o cálculo anexado.",
      "related": [
        {
          "label": "Como calcular juros pela taxa legal da Lei 14.905/2024",
          "to": "/guias/taxa-legal-lei-14905-como-calcular-juros"
        },
        {
          "label": "Correção monetária em ação cível: IPCA ou INPC?",
          "to": "/guias/correcao-monetaria-ipca-ou-inpc"
        },
        {
          "label": "Todas as calculadoras",
          "to": "/calculadoras"
        }
      ],
      "aviso": "Conteúdo informativo, atualizado em novembro de 2026. Não substitui a análise de um advogado sobre o caso concreto."
    }
  }
];
