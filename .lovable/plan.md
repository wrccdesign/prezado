# Destravar o Domain review da Paddle

## Situação atual (verificada agora)

- `honorifico.com.br` e `www.honorifico.com.br` estão **Active** (conectados há ~12 min) e servindo o site (HTTP 200).
- `/termos`, `/reembolso`, `/privacidade` e `/planos` respondem 200 publicamente.
- O **Readiness check, Publish e Verification** estão concluídos.
- O **Domain review falhou** porque, no momento em que a Paddle revisou, `honorifico.com.br` ainda não resolvia — o site estava inacessível para o revisor.
- Próximo passo bloqueado depois: **Business identification** está como "ação necessária" (a Paddle pede documentos da empresa).

## O que fazer

1. **Corrigir referências ao domínio antigo** antes de pedir nova revisão: `index.html` (canonical/og:url), `public/sitemap.xml`, `public/robots.txt`, `src/components/SEO.tsx` e páginas que citam `prezado.lovable.app` ainda apontam para o domínio antigo. Trocar tudo para `https://honorifico.com.br`.
2. **Publicar** o projeto novamente, para que o domínio ativo sirva a versão com os metadados corretos.
3. **Responder ao e-mail da Paddle** (o que informou a rejeição) dizendo que o domínio já está no ar e pedindo nova revisão de `honorifico.com.br`. A reprovação é um passo controlado pela Paddle — não há botão de "retry" no Lovable.
4. **Concluir o Business identification** no painel da Paddle: enviar os documentos da Wrcc Design (CNPJ 15.236.018/0001-64, contrato social/comprovante de endereço, dados bancários). Esse passo segue mesmo com o domain review pendente e evita esperar duas filas em sequência.
5. Enquanto isso, o checkout em modo teste continua funcionando normalmente na preview; o checkout ao vivo só funciona depois que todos os passos ficarem verdes.

## Detalhes técnicos da etapa 1

- `index.html`: `<link rel="canonical">`, `og:url` e `twitter` para `https://honorifico.com.br/`.
- `src/components/SEO.tsx`: base URL do canonical/og passa de `prezado.lovable.app` para `honorifico.com.br`.
- `public/sitemap.xml`: reescrever todas as `<loc>` com o novo domínio.
- `public/robots.txt`: atualizar a linha `Sitemap:`.
- `src/pages/LandingPage.tsx`, `Comparativo.tsx`, `ModelosMinutas.tsx`, `MinutaDetalhe.tsx`, `src/data/minutas.ts`: substituir URLs/JSON-LD que ainda usam o domínio antigo.
