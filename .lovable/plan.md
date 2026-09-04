# Print do WhatsApp vira caso analisável

O envio de imagem já funciona (foto e print passam por leitura de texto). O que falta é o site dizer isso na hora certa e tornar o gesto natural: a pessoa já tem o print copiado, não quer procurar um botão de arquivo.

## O que muda na página de análise

1. **Área de envio explícita**
   Substituir o botão isolado por uma área de arrastar e soltar, alinhada ao sistema visual (fundo branco, borda cream-dark, raio 8px, sem sombra, sem seta e sem ícone decorativo ao lado de título). Texto dentro dela:
   "Arraste o arquivo, cole um print com Ctrl+V ou escolha do aparelho."
   Abaixo, em nota: "Print de conversa, foto de documento, PDF, Word ou texto. Lemos o texto da imagem."
   No celular o mesmo bloco vira um toque que abre a câmera ou a galeria.

2. **Colar imagem direto (Ctrl+V / colar no celular)**
   Escutar o evento de colar na página: se o que veio for imagem, ela entra no mesmo fluxo de leitura de texto já existente; se for texto, continua caindo no campo de texto como hoje.

3. **Arrastar e soltar**
   Soltar arquivo em qualquer ponto do bloco de análise inicia a leitura, com o mesmo aviso de tamanho e formato já usados.

4. **Retorno durante a leitura da imagem**
   Quando o arquivo é imagem, as etapas exibidas passam a ser: "Lendo a imagem", "Reconhecendo o texto", "Concluído", em vez das etapas escritas para PDF.

5. **Quando a imagem não tem texto legível**
   Mensagem única e útil, sem termo técnico: "Não consegui ler o texto dessa imagem. Tente um print mais nítido, sem corte, ou cole o texto da conversa."

## Marketing: onde isso aparece fora da página

6. **Uma linha no primeiro bloco da home**, junto ao campo de busca, sem virar card nem selo:
   "Print de conversa, foto de documento ou PDF: lemos o texto e devolvemos a análise."

7. **Um item novo no FAQ**: "Posso enviar um print do WhatsApp?" com resposta objetiva sobre formatos e limite de tamanho. Entra no mesmo FAQ estruturado que já existe, o que também ajuda a busca no Google.

Nenhum splash em cima da tela, nenhum aviso que precise ser fechado: o valor é dito no lugar onde a ação acontece.

## Detalhes técnicos

- `src/pages/Index.tsx`: extrair a lógica atual de `handleFileUpload` para receber um `File` de qualquer origem (input, colar, arrastar); adicionar `onPaste` no container e handlers de `dragover`/`drop`; ramificar os textos de progresso por tipo de arquivo.
- Sem mudança na função de leitura no backend nem nos limites de tamanho já aplicados (5MB PDF, 10MB demais).
- `src/pages/LandingPage.tsx`: uma linha de texto abaixo do campo de busca.
- `src/seo/faqData.ts`: uma pergunta nova.
