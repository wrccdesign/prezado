# Controle compacto de tamanho do texto

## Decisão

Substituir os três botões sempre visíveis no cabeçalho por um único botão **“Aa”**, com cerca de 40 px. Ao acioná-lo, abrir um menu compacto com as três opções atuais: **Padrão**, **Grande** e **Maior**.

Esse padrão combina melhor com produtos editoriais e profissionais atuais: preserva a descoberta do recurso sem consumir aproximadamente 136 px do cabeçalho. O controle continuará sendo um complemento ao zoom do navegador, que deve funcionar até 200% sem perda de conteúdo ou funcionalidade, conforme a orientação WCAG.

## Como ficará

### Computador e tablet
- Exibir um único botão “Aa” antes da área de entrada ou conta.
- Abrir um menu curto com o título “Tamanho do texto”.
- Mostrar as três opções em um controle segmentado dentro do menu.
- Indicar claramente a opção ativa.
- Usar o mesmo padrão para visitantes e pessoas autenticadas, eliminando a inconsistência atual.

### Celular
- Manter o ajuste dentro do menu lateral, mas reduzir a área ocupada.
- Exibir uma linha “Tamanho do texto” com o valor atual e abrir as opções somente ao toque.
- Evitar uma faixa permanente com três botões grandes no topo do menu.

## Comportamento e acessibilidade
- Preservar os três níveis atuais e a preferência já salva no navegador.
- Manter aplicação imediata em todas as páginas.
- Identificar o botão como “Ajustar tamanho do texto”.
- Expor estado aberto/fechado e opção selecionada para leitores de tela.
- Permitir abrir e selecionar por teclado, fechar com Esc e devolver o foco ao botão “Aa”.
- Manter área mínima de toque de 44 px sem ocupar largura equivalente a três botões.
- Não adicionar painel genérico, promessa de conformidade ou novos recursos de acessibilidade nesta etapa.

## Implementação técnica
- Reutilizar o menu acessível já adotado no cabeçalho.
- Extrair o seletor para uma pequena unidade reutilizável entre computador, conta e menu móvel.
- Manter intactos o armazenamento local e as classes de escala atuais.
- Usar apenas tokens visuais existentes do Honorífico, sem alterar cores, tipografia geral ou navegação.

## Verificação
- Conferir visitante e autenticado em computador, tablet e celular.
- Validar que o cabeçalho não transborda nos três tamanhos de texto.
- Confirmar seleção, persistência após recarregar, teclado, foco e leitores de tela.
- Testar zoom do navegador a 200% sem perda de acesso ao controle.
- Confirmar que o restante do menu móvel e da conta permanece inalterado.
