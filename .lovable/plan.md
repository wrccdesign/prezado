# Situação do DNS de honorifico.com.br

## Verificação feita agora (16:44, horário de SP)

Consultei diretamente os servidores autoritativos do domínio — `a.auto.dns.br` e `b.auto.dns.br` (DNS gratuito do Registro.br), que continuam sendo os nameservers oficiais:

| Registro | Estado no autoritativo |
|---|---|
| A `honorifico.com.br` | ausente |
| A `www.honorifico.com.br` | ausente |
| TXT `_lovable` | ausente |
| TXT `_lovable.www` | ausente |

Status no Lovable: ambos os domínios seguem em `initiated` há 4h19.

**Não é propagação.** Propagação afeta resolvers públicos (Google, operadora), nunca o servidor autoritativo — se os registros estivessem salvos na zona, `a.auto.dns.br` responderia na hora. Ele responde vazio, ou seja, a zona não tem os registros.

## Causas mais prováveis

1. Os registros foram digitados no Registro.br mas a zona não foi **publicada** (falta clicar em Salvar/Publicar em DNS → Editar Zona).
2. Os registros foram criados em outro provedor (Cloudflare, HostGator, cPanel) que **não** é o autoritativo — os nameservers do domínio ainda apontam para `auto.dns.br`.

## O que fazer

1. Entrar no Registro.br → `honorifico.com.br` → **DNS → Editar Zona**.
2. Conferir se os 4 registros aparecem listados lá. Se não aparecerem, criá-los e **publicar**:

| Tipo | Nome | Valor |
|---|---|---|
| A | (vazio / `@`) | `185.158.133.1` |
| A | `www` | `185.158.133.1` |
| TXT | `_lovable` | `lovable_verify=4937a588b8d69c3fad29878ee433e60e0c1973c4fc6dc66bd50d9d6abd4cf5f0` |
| TXT | `_lovable.www` | `lovable_verify=65a2ffcb270a373417ccbcef5c144e44735a1389b7cfa3e6a13a54633d4f7001` |

3. Se você cadastrou em outro provedor (ex.: Cloudflare): ou repita os registros no Registro.br, ou troque os nameservers do domínio para os do provedor. Usando Cloudflare com proxy, é preciso reconectar o domínio no Lovable marcando "usa Cloudflare ou proxy similar" (setup por CNAME).
4. Me avisar depois de publicar: eu reconsulto os autoritativos e confirmo.

## Depois que ficar Active

- Trocar canonical, `og:url`, JSON-LD, `sitemap.xml` e `robots.txt` de `prezado.lovable.app` para `https://honorifico.com.br` (arquivos: `index.html`, `src/components/SEO.tsx`, `public/sitemap.xml`, `public/robots.txt`).
- Definir o domínio primário e republicar.
- Reenviar à Paddle para nova Domain review.

## Alternativa para destravar a Paddle já

Submeter à Paddle o domínio que já está no ar (`prezado.lovable.app`) e conectar o `honorifico.com.br` quando o DNS estiver pronto.
