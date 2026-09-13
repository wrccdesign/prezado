# Home: legibilidade e revisão de copy

Dois planos separados. Nada é implementado antes da sua decisão.

---

# Parte 1, tipografia da home

Critério das Etapas 2 e 3: texto que a pessoa lê sobe para 15/16px; rótulo puro e metadado ficam onde estão.

## Levantamento, ocorrência por ocorrência

| Onde | Hoje | Decisão |
|---|---|---|
| Hero, rótulos dos 4 atalhos (linha 150) | text-sm | mantém, rótulo de botão |
| Hero, tribunal e tipo da decisão (182) | text-sm | mantém, metadado de ficha |
| Hero, número CNJ (186) | text-sm mono | mantém, código |
| Hero, rodapé da ficha: "Ver fonte no CNJ" e "Resultado de consulta real" (189) | text-sm | sobe para 15px (`text-note`), é o elo de confiança da ficha |
| Corpo das 4 etapas (221) | text-sm | sobe para `text-reading` (16px/1.65) |
| Link de ação das etapas (224) | text-sm | mantém, rótulo de link |
| Linha do chat jurídico (232) | text-sm | sobe para `text-reading` |
| Tabela de memória de cálculo (264) | text-sm | sobe para `text-base` no corpo; cabeçalho fica em 15px |
| Intro da calculadora (302) | text-sm | sobe para `text-reading` |
| "Outras calculadoras" (317) | text-sm | sobe para `text-reading` |
| Planos, badge "Mais popular" (357) | text-xs | mantém, rótulo |
| Planos, descrição do plano (360) | text-sm | sobe para `text-reading` |
| Planos, período "/mês" (363) | text-sm | sobe para 15px, fica junto do preço |
| Planos, nota anual (365) | text-note | mantém 15px |
| Planos, lista de recursos (368) | text-sm | sobe para `text-reading` |

Fora do arquivo, mas visível na mesma página: a tabela "Por que a fonte importa" (`FonteTable.tsx`) também está em text-sm. Sugiro subir junto para não ficar a única tabela pequena da página. Diga se inclui.

## Ajustes de altura para o texto maior caber

- Corpo das etapas: `min-h-[4.5rem]` passa a `min-h-[5.5rem]` em desktop, liberado no mobile.
- Nota anual dos planos: `min-h-[2.5rem]` passa a `min-h-[3rem]`, para a linha de duas quebras não empurrar o botão.
- Espaçamento da lista de recursos de 2.5 para 3, para a entrelinha maior não colar os itens.

## Verificação antes de reportar

Capturas em 375px e 1280px nos três tamanhos do controle "Aa", conferindo os 3 cards de planos, a tabela de memória e o bloco de etapas. Qualquer corte é corrigido antes da entrega.

## Não muda

Estrutura de seções, links, CTAs, cores, hero (título, busca, atalhos), JSON-LD e SEO.

---

# Parte 2, revisão de copy e UX writing

Proposta de revisão, para discutir. Nenhuma linha muda sem seu ok.

## Jornada atual

Hero, quatro etapas, por que a fonte importa, memória de cálculo, calculadora, planos, CTA final.

A espinha está certa: promessa, como funciona, prova, ferramenta livre, preço, chamada. Dois problemas de ritmo:

1. **Memória de cálculo e calculadora dizem a mesma coisa duas vezes.** A seção da tabela promete o documento, a seguinte entrega o documento. Hoje são duas seções com título próprio e dois textos de apoio. Proposta: a tabela vira a abertura da seção de cálculo, uma seção só, com um título e um texto de apoio. Ganha ritmo e tira uma repetição.
2. **A prova está no lugar errado.** A ficha do TJPR no hero e a seção "Por que a fonte importa" defendem o mesmo argumento, separadas por uma seção inteira de funcionalidades. Alternativa mais leve, sem mexer em estrutura: ajustar o texto de apoio das etapas para não repetir "fonte", deixando o argumento inteiro para a seção dele.

## Copy fraca ou vaga, por seção

- **Hero, frase de apoio.** "Diagnóstico, petição e precedente, sempre com fonte verificável antes de você protocolar." Lista três produtos antes de dizer o que muda para quem lê. Alternativa: dizer o que a ferramenta faz com o caso, deixando os três nomes para a seção seguinte, que já os apresenta.
- **Hero, duas notas seguidas.** Print/PDF e limite de buscas são assuntos diferentes, empilhados no mesmo peso visual. A de print é capacidade do produto e merece estar mais acima; a de limite é regra de uso e cabe como nota final.
- **Etapas, texto de apoio.** "Cada uma entrega um artefato que você aproveita na seguinte." "Artefato" é palavra de quem construiu o sistema. Trocar por o que a pessoa leva dali.
- **"Calcule agora, sem cadastro".** Bom título. O texto abaixo repete "sem conta" logo depois de "sem cadastro". Uma vez basta.
- **Descrições dos planos.** "Para conhecer a plataforma", "Para advogados autônomos", "Para escritórios de advocacia" descrevem o público, não a decisão. Alternativa: dizer o que cada faixa resolve, mantendo o mesmo tamanho de frase.
- **Nomes dos botões dos planos.** "Começar Grátis", "Assinar Agora", "Assinar Escritório" usam caixa alta em cada palavra e "Agora" não acrescenta. Padronizar em caixa baixa e mesmo verbo.
- **CTA final.** O título é o melhor da página. Falta uma linha curta abaixo dizendo o que acontece ao clicar, hoje o botão está sozinho.

## Conversão, sem superlativo

Tudo abaixo é verificável no produto ou no banco, nenhuma promessa de resultado:

- Repetir a nota dos 7 dias sem cartão junto ao botão do CTA final, onde a decisão é tomada. Hoje ela só aparece no hero e acima dos planos.
- No card Gratuito, "Petições não incluídas" é o único item negativo da lista e fica no fim, deixando má impressão final. Manter a informação, mas como nota fora da lista.
- Tornar o preço anual comparável: os dois planos pagos já trazem a nota, o Gratuito tem a linha vazia. Preencher com uma frase neutra estabiliza a leitura dos três cards.

## Tom

Está consistente, com duas exceções: "artefato" na seção de etapas e a caixa alta dos botões de plano, que soa a anúncio e destoa do resto da página.
