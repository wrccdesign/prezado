# Etapa 1: corrigir a leitura de PDF

O relato do advogado tem causa técnica confirmada: o texto que sai de um PDF hoje não é o mesmo texto que ele cola. A leitura atual é um parser feito à mão que apaga repetições, perde parágrafos e ignora a parte comprimida do arquivo, que é onde mora quase todo o texto de uma petição.

## A) Os 6 pontos, item a item

1. **Deduplicação destrutiva — confirmado.** `extractPdfText` mantém um `Set seen` e só empurra o fragmento se `!seen.has(t)`. Todo trecho idêntico repetido (mesmo valor, mesmo artigo, mesmo nome de parte, cabeçalho recorrente) desaparece a partir da segunda ocorrência. É o suspeito mais grave para valores monetários.
2. **Estrutura perdida — confirmado.** `parts.join(" ")` produz uma linha única. Não há quebra de parágrafo, título ou separação entre fatos e pedidos.
3. **Conteúdo comprimido ignorado — confirmado.** `raw.replace(/stream[\r\n][\s\S]*?endstream/gi, " ")` apaga todos os streams antes de procurar operadores `Tj`/`TJ`. Em PDF gerado por Word, PJe ou e-SAJ o texto está dentro desses streams (FlateDecode), então sobra pouco ou nada e o fluxo cai no OCR — que é mais lento, mais caro e menos fiel.
4. **Truncamento corrompe o arquivo — confirmado.** `processLargePdfOcr` faz `bytes.subarray(0, OCR_CHUNK_SIZE)` acima de 2MB. Um PDF cortado no meio não tem tabela xref nem trailer: é binário inválido, não "as primeiras páginas". E o resultado ainda é rotulado `partial: true`, dando ao usuário a impressão de extração parcial legítima.
5. **Filtros que apagam conteúdo — confirmado, com ressalva.** `isReadableText` exige 60% de caracteres da lista permitida; ela inclui dígitos, `.,;:()/-` e `R$` não entra, então uma linha com muitos cifrões ou símbolos pode ficar abaixo do corte. A regra `^\s*\d+\s*$` em `sanitizeText` apaga qualquer linha só de dígitos: remove número de página, mas também remove número de artigo ou valor isolado em linha própria. Também confirmo duas regras vizinhas problemáticas: `\.{5,}` e `_{5,}` viram espaço (some a linha pontilhada de assinatura, tudo bem) e `^\s+$` limpa linhas em branco.
6. **Acentuação — confirmado.** Decodificação `latin1` fixa, `\\(.)` que transforma `\351` em `351`, nenhum tratamento de `ToUnicode`/CID. Português sai corrompido em boa parte dos PDFs.

Nenhum dos seis está errado.

## B) Biblioteca: `unpdf`

Testei no runtime Deno, importando de esm.sh, com um PDF de duas páginas contendo o mesmo valor repetido:

- importou e executou sem dependência nativa;
- devolveu o texto por página, com `\n` entre linhas;
- **as duas ocorrências de `R$ 4.800,00` vieram**, e `Art. 1.723` chegou íntegro.

`unpdf` é o build serverless do pdf.js, sem canvas nem worker de Node, então descomprime Flate, resolve `ToUnicode` e entrega acentuação correta. É a escolha. `pdf.js` cru via esm.sh exigiria desligar worker e polyfills manualmente, sem ganho. Não precisamos de `DecompressionStream` manual.

Custo: o bundle é da ordem de centenas de KB e a leitura é síncrona em memória; com o teto de 5MB por PDF que já existe, cabe no orçamento de tempo e memória da função.

## C) Sanitização depois da extração

Nova ordem: extrair por página com `unpdf` → juntar páginas com linha em branco → limpeza mínima.

Ficam: remoção de caracteres de controle, colapso de espaços e tabs na mesma linha, colapso de 3+ quebras em 2.

Saem: a deduplicação inteira, a regra que apaga linhas só com dígitos, e o `isReadableText` por fragmento. Fica só uma verificação global do resultado, para decidir se vale acionar OCR.

## D) PDF grande

Corte de bytes sai. No lugar, limite por página, que é o que o formato permite: lê todas as páginas até um teto (proposta: 60 páginas), e se o documento passar disso, devolve o texto das primeiras com `partial: true` e uma mensagem que diz quantas páginas foram lidas de quantas. Rasterizar página a página não é viável sem canvas no runtime. O OCR continua existindo apenas como plano B para PDF escaneado, e nesse caso, se o arquivo exceder o limite, a resposta passa a ser uma recusa explicando o motivo, em vez de mandar binário quebrado para o modelo.

## E) Conferir o texto antes de analisar

Vale, e é barato: a tela de Meu caso já mostra o texto extraído num campo editável (`showPreview`). O que falta é o usuário entender que aquilo é o que a IA vai ler. Proposta mínima nesta etapa: rótulo claro acima do campo ("este é o texto que será analisado, confira antes de continuar") e o aviso de leitura parcial dizendo quantas páginas entraram. Sem componente novo.

## F) Regressão

`parse-document` é chamada de um único lugar: `src/pages/Index.tsx`, que atende tanto `/analise` quanto a aba "Tenho um documento" de Meu caso. O contrato `{ text, ocr, partial, ocr_timeout }` e a resposta de erro `{ error }` ficam exatamente iguais; só o conteúdo de `text` melhora. Cota, autenticação e limites não mudam.

Riscos: PDF protegido por senha passa a dar erro específico em vez de cair no OCR (melhor, mas é comportamento novo); texto agora vem maior, podendo bater no teto de 50.000 caracteres com mais frequência — mantenho o teto e o corte passa a avisar.

## Arquivos e ordem de execução

1. `supabase/functions/parse-document/index.ts` — trocar `extractPdfText` por `unpdf`, remover dedup e o truncamento de bytes, enxugar `sanitizeText`, limite por páginas, OCR só como plano B. Publicar.
2. Teste de extração com PDF real de petição: conferir valor repetido, acentuação, parágrafos e número de artigo.
3. `src/pages/Index.tsx` — rótulo de conferência do texto e mensagem de leitura parcial por páginas.
4. `bunx tsgo --noEmit`, `bun run build`, e uma passada de ponta a ponta pelo upload.
