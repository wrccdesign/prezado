# Identificação do advogado e timbre do escritório nas petições

## Bloco A — respostas

### A1) Onde guardar o nome civil

`formatting_preferences` existe apenas como coluna `jsonb DEFAULT '{}'` criada na migração de março; **nenhum código lê ou grava nela**. É um campo morto, sem forma definida.

Recomendação: **coluna nova `full_name text` em `profiles`**, e não dentro do JSON.

Motivos:
- O nome é identidade, não preferência. Vai para o bloco de assinatura de um documento protocolado, ao lado de `oab_number`/`oab_state`, que já são colunas.
- Coluna tipada aparece no `types.ts` gerado, é validável e consultável; dentro do JSON vira `any` e cada leitura precisa de cast.
- `formatting_preferences` fica então para o que é de fato preferência de timbre — por exemplo `{ "timbre": true }` — e é ali que vamos guardar o interruptor do cabeçalho do escritório.

O campo será preenchido no `SettingsTab` e, para quem já tem conta, fica vazio até editar — daí o fallback do B2.

### A2) Quem lê os dados do escritório hoje

Ninguém. `office_name`, `oab_number`, `oab_state`, `office_address`, `office_phone`, `office_email` aparecem só em: `Auth.tsx` (grava três deles no cadastro), `UserProfileContext.tsx` (tipagem) e `SettingsTab.tsx` (lê e grava). Petições salvas, `petition_templates`, painel do advogado, `generate-petition` e `PetitionResult.tsx` não leem nada. Portanto os campos da tela de configurações **ficam** — esta feature passa a ser o consumidor deles.

### Achado adicional, que muda a implementação do logo (C4)

As políticas do bucket `office-logos` estão corretas quanto ao isolamento: INSERT, UPDATE, DELETE e SELECT exigem `auth.uid()::text = (storage.foldername(name))[1]`, ou seja, cada usuário só escreve e lê a própria pasta e não consegue sobrescrever o arquivo de outro.

Mas o bucket é **privado**. O código antigo usava `getPublicUrl`, que num bucket privado devolve uma URL que retorna 403 — outro motivo pelo qual o logo nunca funcionaria. Então não guardaremos URL pública: guardamos o **caminho** no storage e, na hora de exportar, baixamos o arquivo pelo cliente autenticado (`storage.download`) e o convertemos em data URL. Isso evita CORS, mantém o bucket privado e não expõe o logo de ninguém.

## Bloco B — o que será implementado

### Banco
- Migração: `ALTER TABLE public.profiles ADD COLUMN full_name text;` (sem alterar RLS — as políticas atuais de `profiles` já cobrem a coluna).

### Exportação (`PetitionResult.tsx`)
- Passa a carregar o perfil do usuário (`full_name`, `office_*`, `oab_*`) uma vez, junto do plano atual.
- **B1, todos os planos:** "Honorífico" sai do cabeçalho e do rodapé, no PDF e no DOCX. O rodapé passa a ser apenas "Documento deve ser revisado por advogado habilitado", sem atribuição de autoria à plataforma. O cabeçalho sem timbre fica só com a data, como já ficava à direita.
- **B2, Profissional e Escritório:** o bloco de assinatura imprime `full_name` na primeira linha e `OAB/UF nº 000000` na segunda. Faltando qualquer um dos dois, cai para o texto genérico atual — o documento nunca quebra por campo vazio.
- **B3, apenas Escritório:** cabeçalho com timbre — logo à esquerda, nome do escritório em negrito, e uma linha com endereço · telefone · e-mail. Aplicado em **todas** as páginas, dentro do `addPageHeaderFooter` do PDF e do `Header` do DOCX (que já repete por página). A margem superior do corpo aumenta quando há timbre, para o texto não colidir.

### Upload do logo (`SettingsTab.tsx`)
- Card "Logo do Escritório" volta, agora com função real.
- `accept="image/png,image/jpeg"`, com validação de tipo e de tamanho (2 MB) no cliente e mensagem dizendo exatamente que só PNG e JPEG são aceitos, porque o jsPDF não desenha SVG.
- Grava o caminho (`<user_id>/logo.png`) em `office_logo_url`; nenhum arquivo já enviado é apagado. Valores antigos que sejam URL completa continuam sendo lidos (extraímos o caminho a partir do nome do bucket).
- Preview usando URL assinada de curta duração.

## Bloco C — como as restrições serão cumpridas

- **C1** — input restrito a `image/png,image/jpeg` e checagem de `file.type` antes do upload.
- **C2** — todo o carregamento do logo fica em `try/catch`; qualquer falha (arquivo ausente, formato inválido, leitura quebrada) apenas registra no console e o cabeçalho segue em texto. O download nunca é abortado por causa da imagem.
- **C3** — as dimensões naturais vêm de um `Image` carregado a partir do data URL; a altura é calculada pela proporção a partir de uma largura máxima de cabeçalho (limitada também por uma altura máxima, para logos muito verticais).
- **C4** — políticas verificadas por consulta, não inferidas: isolamento por pasta em todas as operações. Ajuste decorrente: bucket privado, então nada de `getPublicUrl`.
- **C5** — o timbre é desenhado dentro de `addPageHeaderFooter`, que já é chamado a cada `addPage`; no DOCX o `Header` do `docx` repete por definição.

## Bloco D
O aviso de revisão permanece no rodapé do arquivo; sai apenas a marca "Honorífico". Nada além disso será mexido.

## Fora de escopo
Texto da petição, `generate-petition`, cotas, preços e autenticação seguem intocados. Nenhum logo enviado por usuário é apagado.
