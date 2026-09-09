# Refinar a interface da home pública

## Direção aprovada

Aplicar uma interpretação do protótipo **Contraste dramático** compatível com o branding Honorífico:

- creme como fundo predominante;
- navy em áreas estratégicas de contraste, sem transformar a página em tema escuro;
- dourado escasso, reservado à ação ou informação prioritária;
- Source Serif 4 nos títulos e Source Sans 3 na interface;
- composição editorial, com mudanças de escala e ritmo em vez de efeitos decorativos;
- sem gradientes, sombras decorativas, caixa alta, setas, animações de entrada ou conteúdo fictício.

## O que será redesenhado

### 1. Hero com maior presença
- Manter a busca, os atalhos, a decisão real e o texto atual.
- Aumentar o contraste entre título, apoio, busca e notas.
- Reorganizar a ficha judicial para parecer uma prova documental integrada à composição, não um card isolado.
- Garantir que a frase principal continue sendo o foco no desktop e no celular.

### 2. Serviços mais fáceis de entender
- Transformar “Do fato ao fundamento” em uma sequência editorial numerada com hierarquia mais forte.
- Dar a cada serviço uma descrição e ação claramente separadas, sem criar uma grade de cards genéricos.
- Evidenciar a passagem entre Diagnóstico, Análise de documentos, Consulta processual e Petição.

### 3. Prova antes da promessa
- Dar mais peso visual à tabela “Por que a fonte importa”.
- Melhorar cabeçalho, contraste de colunas e leitura das linhas sem alterar os dados.
- Fazer a transição dessa prova para a memória de cálculo parecer parte da mesma narrativa.

### 4. Ferramentas demonstradas no próprio fluxo
- Refinar a tabela de memória de cálculo e o bloco da calculadora para leitura mais rápida.
- Preservar integralmente o funcionamento da calculadora, exportação e envio de valor para a petição.
- Reduzir a sensação de caixas empilhadas usando alinhamento, linhas e superfícies funcionais.

### 5. Planos e fechamento
- Manter o fundo navy como principal momento de contraste da página.
- Melhorar a comparação entre planos por hierarquia de preço, recursos e ação.
- Preservar preços, limites, trial e todos os destinos atuais.
- Integrar o CTA final ao fechamento sem parecer uma seção duplicada.

### 6. Cabeçalho na home
- Refinar somente a apresentação do cabeçalho público quando necessário para compor com a nova home.
- Manter logo, menus, autenticação e comportamento atuais.

## Limites do trabalho

- Apenas a home pública e os componentes visuais diretamente usados por ela.
- A home pós-login, demais páginas, backend, pagamentos, cotas, SEO e textos funcionais permanecem inalterados.
- Nenhuma alegação, estatística ou fonte nova será inventada.
- O logo não será modificado.

## Detalhes técnicos

- Reutilizar os tokens HSL existentes em `src/index.css` e as configurações atuais do Tailwind.
- Concentrar a composição da página em `src/pages/LandingPage.tsx` e ajustar `FonteTable` ou o cabeçalho apenas se necessário para consistência.
- Usar os componentes de botão e formulário já existentes.
- Manter semântica de um único H1, tabelas reais e navegação acessível.
- Não adicionar biblioteca, imagem ou dependência.

## Validação

- Verificar typecheck, build e auditoria de SEO existentes.
- Testar busca, links principais e calculadora na home.
- Conferir visualmente em desktop de 1280 px e celular de 390 px.
- Revisar contraste, quebras de texto, ausência de sobreposição e a regra de dourado escasso por viewport.
