# Pagamentos redondos: aviso automático do Asaas, limpeza da cobrança real e reindexação

## Situação atual (verificada)

- O checkout Asaas funciona (Pix e cartão, mensal e anual), mas o site **nunca recebeu nenhum aviso do Asaas**: nenhum evento em `payment_events`, nenhum log da função `asaas-webhook`. Sem o aviso, quem paga não tem o plano ativado sozinho. Essa é a pendência central.
- Existe uma assinatura criada em 14/09 às 14:12 em **produção** a partir de um teste no preview (status incompleto) e um pagamento real de R$ 49 a cancelar/estornar.
- Voyage: usuário já cadastrou forma de pagamento. Restam 2 decisões de 6.497 sem indexação.

## O que EU faço no código

1. **Card "Configuração do Asaas" na página de administração** (`/admin/ingestao`, que já é restrita a administradores, e sua conta é a única com esse papel): mostra o endereço exato do aviso para copiar e colar no painel do Asaas, o nome do cabeçalho (`asaas-access-token`) e a lista de eventos a marcar. O endereço aparece dentro do site, não no chat, por política de não expor o endereço interno do backend no chat.
2. **Reindexar as 2 decisões**: chamar `backfill-embeddings` com lote de 2 (função existente) e confirmar `embedding IS NULL` = 0.
3. **Teste ponta a ponta no sandbox**: gerar um checkout de teste no preview, você simula o pagamento no painel do Asaas (sandbox) e eu confirmo que o plano ativa sozinho no site. Só depois disso o aviso é ligado em produção.
4. **Consistência local**: com o aviso ativo, o estorno do R$ 49 e o cancelamento da assinatura de teste chegam como eventos (`PAYMENT_REFUNDED`, `SUBSCRIPTION_DELETED`) e o banco volta ao plano gratuito automaticamente. Se algum evento não chegar, limpo o registro local manualmente.

## O que VOCÊ faz no painel do Asaas (eu forneço o passo a passo)

1. **Aviso automático (produção)**: painel do Asaas, Integrações, Webhook para cobranças: colar o endereço copiado da página de administração, colar o token ao vivo (o mesmo salvo como `ASAAS_WEBHOOK_TOKEN_LIVE`; se não tiver mais o valor, eu abro o formulário seguro para você recadastrar) e marcar os eventos de cobrança e assinatura.
2. **Mesmo cadastro no sandbox**, para o teste do item 3 acima.
3. **Limpeza**: cancelar a assinatura de 14/09 e estornar o pagamento real de R$ 49, se aparecer como pago.

## Ordem

1. Card de configuração no site + reindexação (sem risco, código meu).
2. Aviso no sandbox, teste completo de ativação.
3. Aviso em produção, depois cancelar/estornar a cobrança real (assim os eventos chegam e o banco se mantém consistente).
4. Conferência final: nenhum evento faltando, zero decisões sem indexação.
