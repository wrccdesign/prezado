# Logo, dados do escritório e marca na petição

## O que a varredura mostrou

Busquei `office_name`, `oab_number`, `oab_state`, `office_address`, `office_phone`, `office_email`, `office_logo_url` e `formatting_preferences` em todo o `src/` e em todas as edge functions.

Resultado: **nenhum consumidor**. Os campos só aparecem em três lugares:

- `Auth.tsx` — grava `oab_number`, `oab_state` e `office_name` no cadastro do advogado.
- `UserProfileContext.tsx` — declara os campos no tipo do perfil (só tipagem; nenhuma tela usa esses valores).
- `SettingsTab.tsx` — lê e grava todos eles.

Petições salvas, modelos (`petition_templates`), painel do advogado, `generate-petition` e `PetitionResult.tsx` não leem nada disso. O `PetitionResult` escreve "Honorífico" fixo no cabeçalho (PDF linha 98, DOCX linha 193) e "Gerado por Honorífico — Documento deve ser revisado por advogado habilitado" no rodapé. A OAB coletada no cadastro também não chega à peça.

Como nada muda por já estar em uso, a recomendação não muda: **opção (b) — manter os campos e implementar o uso deles na exportação.**

Motivo: os campos são exatamente o insumo que falta para resolver o item 1.5, que é o problema mais grave. Removê-los agora (opção a) significa apagar dados que os usuários já preencheram e, quando formos consertar o cabeçalho, recriar os mesmos campos. A opção (b) transforma um formulário morto no que faz a exportação virar uma peça protocolável.

## O que fazer agora (aprovação deste plano)

1. Remover o card "Logo do Escritório" inteiro do `SettingsTab` — upload, preview e botão de remoção — e os estados/handlers que só existem para ele.
2. Trocar a descrição do `PlanGate` no mesmo arquivo ("Logo personalizado nas petições…") por um texto sobre o que o plano Escritório realmente entrega: dados do escritório e OAB no perfil, mais o volume maior de consultas e documentos.
3. Manter os campos de nome do escritório, endereço, telefone, e-mail e OAB, com uma nota curta e honesta na tela informando que esses dados ainda não são impressos na peça exportada — enquanto o item 1.5 não for aprovado, a tela não pode prometer o que não faz.
4. Não tocar no bucket `office-logos` nem nos arquivos já enviados. A coluna `office_logo_url` permanece no banco, apenas sem interface.
5. Pix: manter o processamento inbound no `payments-webhook` e no `billing-account`, adicionando um comentário curto em cada um explicando que o Pix não é oferecido no checkout hoje, mas o recebimento continua ativo de propósito.

## Item 1.5 — o que seria necessário (não executar agora)

Para o cabeçalho usar os dados do advogado e o aviso de rodapé ficar discreto ou opcional:

- `PetitionResult.tsx` precisa receber o perfil. Hoje ele não consulta nada; passaria a ler `profiles` via `UserProfileContext` (ou uma prop vinda de `Petition.tsx`) com `office_name`, `oab_number`, `oab_state`, `office_address`, `office_phone`, `office_email`.
- Cabeçalho: quando houver `office_name`, imprimir o escritório e, abaixo, a linha de contato (endereço · telefone · e-mail). Sem `office_name`, cair para o nome do advogado e a OAB. Sem nenhum dos dois, manter o comportamento atual e sugerir o preenchimento no painel.
- Assinatura: trocar a linha genérica "Advogado(a) / OAB" pelo nome e pela OAB reais quando existirem.
- Rodapé: o aviso de revisão é uma proteção legal, então ele não sai por completo. Vira uma linha discreta em corpo menor e cinza, sem a marca — algo como "Documento gerado com auxílio de inteligência artificial; revisar antes do protocolo" — com um interruptor no painel para removê-lo quando o advogado assumir a revisão. A marca "Honorífico" sai do documento exportado.
- Ambas as saídas precisam do mesmo tratamento: `jsPDF` no PDF e `docx` no DOCX, com paginação verificada, porque um cabeçalho de três linhas empurra o corpo do texto.
- Sem mudança de banco: todas as colunas já existem.

## Escopo técnico do que será alterado agora

- `src/components/lawyer-dashboard/SettingsTab.tsx` — remoção do bloco de logo, ajuste do texto do `PlanGate`, nota sobre os campos ainda não impressos.
- `supabase/functions/payments-webhook/index.ts` e `supabase/functions/billing-account/index.ts` — apenas comentários.
- Nenhuma alteração de banco, de preços, de cotas ou de autenticação.
