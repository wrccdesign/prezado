# "Página com redirecionamento" no Search Console

## O que o aviso significa (verificado)

O aviso é informativo, não é erro. Ele aparece quando o Google rastreia um endereço que redireciona para outro. No seu caso:

- `https://www.honorifico.com.br/` → redireciona para `https://honorifico.com.br/`
- `https://prezado.lovable.app/` → redireciona para `https://honorifico.com.br/`

A página principal está saudável: o Search Console reporta "Enviada e indexada", robots permitido, busca bem-sucedida, canônica escolhida pelo Google = `https://honorifico.com.br`. Ou seja, o conteúdo está indexado no endereço certo; apenas os endereços duplicados (www e o domínio antigo) ficam classificados como "com redirecionamento", que é exatamente o comportamento desejado.

O que realmente importa hoje é outro ponto: 0 cliques e 0 impressões nos últimos 28 dias — o site está indexado, mas sem tráfego de busca.

## O que fazer

1. Não corrigir os redirecionamentos — eles estão certos. Marcar o aviso como "Validar correção" no relatório de indexação para o Google reprocessar e limpar a lista.
2. Manter a higiene atual do projeto (já verificada): o sitemap lista apenas URLs do domínio principal, não há nenhum link interno apontando para `www.` ou para o domínio antigo, e a tag canônica de cada página aponta para o domínio principal.
3. Foco no problema real (tráfego zero): reforçar as páginas de calculadoras, que são as que têm potencial de busca. Titles e descrições orientados à intenção de pesquisa ("calcular prazo processual", "correção monetária Lei 14.905", "custas TJSP"), conteúdo explicativo abaixo de cada calculadora e FAQ com marcação estruturada.

## Detalhes técnicos

- Nada muda em código para resolver o aviso: os redirecionamentos são feitos na camada de hospedagem/DNS e o projeto já não referencia os domínios secundários.
- Se você quiser, o passo 3 vira uma etapa separada: adicionar blocos de conteúdo e JSON-LD (`FAQPage`, `SoftwareApplication`) nas cinco landings de calculadora e revisar `SEO.tsx` para títulos/descrições específicos por página.
