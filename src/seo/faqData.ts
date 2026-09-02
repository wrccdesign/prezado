// Fonte única de verdade dos FAQs estruturados.
// TypeScript puro: sem React e sem APIs de browser, este arquivo é
// importado tanto pelas páginas quanto pelo vite.config.ts (Node).

export interface FaqItem {
  question: string;
  answer: string;
}

/** JSON-LD de FAQPage correspondente aos mesmos itens exibidos. */
export function buildFaqJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}


export const FAQ_PLANOS: FaqItem[] = [
  {
    question: "Preciso de cartão para testar o plano Profissional?",
    answer:
      "Não. Toda conta nova começa com 7 dias no plano Profissional, sem cartão. Terminado o período, a conta passa ao plano Gratuito automaticamente, sem cobrança.",
  },
  {
    question: "As calculadoras estão incluídas em todos os planos?",
    answer:
      "Sim. Correção monetária, prazo processual, custas do TJSP, rescisão, pensão alimentícia, operações com datas e validador de CPF/CNPJ são ilimitadas em todos os planos, inclusive sem conta. A assinatura libera os recursos de IA, o histórico salvo e o volume de consulta processual.",
  },
  {
    question: "Como funcionam as cotas mensais?",
    answer:
      "Cada plano tem limites por mês para consultas processuais, chat, diagnósticos, análises de documentos, OCR e petições. Os limites são renovados no primeiro dia de cada mês, no horário de Brasília, e não acumulam de um mês para o outro.",
  },
  {
    question: "O que o plano Gratuito inclui?",
    answer:
      "Por mês: 20 consultas processuais, 10 mensagens no chat, 1 diagnóstico jurídico, 3 análises de documentos e 5 leituras com OCR. Não inclui geração de petições nem o painel do advogado, mas dá acesso às calculadoras, aos modelos de minutas, à exportação em PDF e Word e ao histórico.",
  },
  {
    question: "Quanto custa o plano Profissional?",
    answer:
      "R$ 49 por mês, cobrados em reais. Há também a opção anual por R$ 409 à vista no cartão, equivalente a R$ 34,08 por mês. Como o processamento é internacional, o seu banco pode aplicar IOF sobre a compra.",
  },
  {
    question: "O plano anual renova sozinho?",
    answer:
      "Não. O anual é um pagamento único referente a 12 meses, sem renovação automática: ao fim do período a conta volta ao plano Gratuito, sem nova cobrança. Quem migra de um plano mensal ativo recebe crédito proporcional pelo período não utilizado, aplicado no checkout.",
  },
  {
    question: "Posso pedir reembolso?",
    answer:
      "Sim. Há garantia de 30 dias a partir da compra ou renovação, com devolução integral e sem necessidade de justificar, além do direito de arrependimento de 7 dias previsto no art. 49 do CDC. O pedido é feito por e-mail e o valor volta pelo mesmo meio de pagamento.",
  },
];

export const FAQ_CORRECAO_MONETARIA: FaqItem[] = [
        {
          question: "O que mudou com a Lei 14.905/2024?",
          answer:
            "Desde 30/08/2024, na ausência de índice convencionado, a correção monetária é feita pelo IPCA e os juros de mora correspondem à Selic menos o IPCA (Taxa Legal). Se o resultado dessa conta for negativo, considera-se juros zero (art. 406, §3º, do Código Civil).",
        },
        {
          question: "Qual índice usar para atualizar uma condenação?",
          answer:
            "Prevalece o índice fixado na sentença ou no contrato. Sem previsão, aplica-se o IPCA a partir de 30/08/2024 e, no período anterior, o índice usual do juízo (em geral a Tabela Prática ou o INPC). A calculadora aplica os dois regimes no mesmo cálculo.",
        },
        {
          question: "De onde vêm os índices?",
          answer:
            "Das séries oficiais do Sistema Gerenciador de Séries Temporais do Banco Central, IPCA, INPC, IGP-M, Selic e Taxa Legal, sincronizadas diariamente. O resultado informa a data da última sincronização.",
        },
        {
          question: "Posso escolher juros simples ou compostos?",
          answer:
            "Sim. Você define o tipo de juros (legais pela Lei 14.905/2024, taxa fixa mensal ou sem juros) e o regime de capitalização, simples sobre o saldo corrigido ou compostos mês a mês. O resultado mostra o efeito da escolha linha a linha.",
        },
        {
          question: "A calculadora inclui multa e honorários?",
          answer:
            "Inclui. É possível informar um percentual de multa, indicando se ela incide também sobre os juros, e um percentual de honorários, que entram no total apurado. Ambos aparecem discriminados no resultado.",
        },
        {
          question: "Como funciona o cálculo pró-rata nos meses parciais?",
          answer:
            "Por padrão, os meses inicial e final são calculados proporcionalmente aos dias do período. Você pode desligar essa opção e contar meses inteiros, conforme o critério adotado no seu caso.",
        },
        {
          question: "Consigo exportar a memória de cálculo?",
          answer:
            "Sim. A memória mês a mês pode ser exportada em PDF ou Word, com índice aplicado, variação percentual, fator acumulado, saldo corrigido e juros de cada mês. A exportação exige uma conta gratuita.",
        },
        {
          question: "A calculadora é gratuita?",
          answer:
            "Sim, o cálculo e a memória mês a mês são gratuitos e não exigem login. A conta gratuita é necessária apenas para exportar em PDF ou Word e salvar o histórico.",
        },
      ];

export const FAQ_PRAZO_PROCESSUAL: FaqItem[] = [
        {
          question: "Prazo processual conta sábado e domingo?",
          answer:
            "Não. Nos prazos em dias úteis do processo civil, sábados, domingos e feriados não são computados (art. 219 do CPC). Em prazos contados em dias corridos eles entram, mas o vencimento é prorrogado para o próximo dia útil.",
        },
        {
          question: "Qual a diferença entre disponibilização e publicação no DJe?",
          answer:
            "A disponibilização é o dia em que o ato aparece no Diário eletrônico. A publicação é o primeiro dia útil seguinte a ela (art. 224, §2º, do CPC), e o prazo começa a correr no dia útil posterior à publicação.",
        },
        {
          question: "O recesso forense suspende o prazo?",
          answer:
            "Sim. Entre 20 de dezembro e 20 de janeiro os prazos ficam suspensos (art. 220 do CPC). A calculadora desconta esse período e ainda considera suspensões específicas do tribunal escolhido.",
        },
        {
          question: "A calculadora considera feriados municipais?",
          answer:
            "Sim. Além dos feriados nacionais, você pode informar o estado e o município para que os feriados locais sejam descontados da contagem. Cada dia não computado aparece no resultado com o motivo correspondente.",
        },
        {
          question: "E as suspensões próprias de cada tribunal?",
          answer:
            "É possível selecionar o tribunal para aplicar as suspensões forenses cadastradas para aquele órgão, incluindo a Justiça Federal. Sem tribunal selecionado, entram apenas feriados e o recesso do art. 220 do CPC.",
        },
        {
          question: "Posso lançar o vencimento na minha agenda?",
          answer:
            "Sim. O resultado permite baixar um arquivo .ics com a data de vencimento, que pode ser importado no Google Agenda, Outlook ou Apple Calendário. Esse download exige uma conta gratuita.",
        },
        {
          question: "Preciso de conta para calcular?",
          answer:
            "Não. O cálculo é gratuito e sem login. A conta gratuita só é necessária para exportar o resultado em PDF/Word, gerar o arquivo .ics e salvar o histórico.",
        },
      ];
