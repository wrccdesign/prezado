# Revisão do domínio honorifico.com.br

## O que a verificação mostrou

Consultei os servidores autoritativos do domínio (`a.auto.dns.br` / `b.auto.dns.br`, o DNS gratuito do Registro.br):

- O domínio está registrado e a zona existe.
- `honorifico.com.br` → **nenhum registro A**
- `www.honorifico.com.br` → **NXDOMAIN** (subdomínio não existe)
- `_lovable.honorifico.com.br` → **NXDOMAIN**
- `_lovable.www.honorifico.com.br` → **NXDOMAIN**

Ou seja: os registros ainda **não foram publicados** na zona. Não é atraso de propagação — se estivessem salvos, o servidor autoritativo já responderia mesmo com o Google DNS ainda em cache. O status no Lovable segue `initiated` há ~4h para os dois domínios.

## Causa mais provável

No Registro.br, usar o DNS gratuito (`auto.dns.br`) exige editar a zona em **Painel → seu domínio → DNS → Editar Zona** e clicar em **Salvar/Publicar alterações**. É comum os registros serem digitados e a publicação não ser concluída, ou serem adicionados em outro provedor (Cloudflare, HostGator) que não é o autoritativo atual.

## Passos

1. Entrar no Registro.br, abrir `honorifico.com.br` → **DNS → Editar Zona**.
2. Criar os 4 registros abaixo e **publicar**:

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` (vazio) | `185.158.133.1` |
| A | `www` | `185.158.133.1` |
| TXT | `_lovable` | `lovable_verify=4937a588b8d69c3fad29878ee433e60e0c1973c4fc6dc66bd50d9d6abd4cf5f0` |
| TXT | `_lovable.www` | `lovable_verify=65a2ffcb270a373417ccbcef5c144e44735a1389b7cfa3e6a13a54633d4f7001` |

3. Avisar aqui; eu reconsulto os servidores autoritativos e confirmo a publicação.
4. Quando o Lovable marcar **Active**: eu troco canonical, `og:url`, `sitemap.xml` e `robots.txt` de `prezado.lovable.app` para `https://honorifico.com.br`, escolho o domínio primário e republico.
5. Só então reenviar o site à Paddle para nova Domain review.

## Alternativa para destravar a Paddle agora

Submeter à Paddle o domínio já no ar (`prezado.lovable.app`) e conectar o `honorifico.com.br` depois. Isso libera a verificação empresarial (CNPJ 15.236.018/0001-64) sem esperar o DNS.

## Detalhes técnicos

- Nada muda no código nesta etapa; a ação é no registrador.
- O passo 4 mexe apenas em `index.html`, `src/components/SEO.tsx`, `public/sitemap.xml` e `public/robots.txt`.
- Se o domínio for movido para Cloudflare, é preciso marcar "usa proxy" ao conectar no Lovable (setup por CNAME em vez de A).
