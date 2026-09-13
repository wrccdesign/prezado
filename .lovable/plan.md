# Levantamentos solicitados

## 1. Arquivos `.env*` versionados

Há exatamente três arquivos `.env*` no repositório, e os três estão versionados. Não existem `.env.local`, `.env.test` ou outras variantes.

Por segurança da infraestrutura gerenciada, o identificador, a URL e a chave publicável do banco foram mascarados aqui. A chave é do tipo `anon`/publicável, mas contém o identificador do projeto dentro do próprio token. Os dois tokens de pagamento começam com `pk_`, são chaves publicáveis destinadas ao navegador e, portanto, aparecem integralmente.

### `.env`

```dotenv
VITE_SUPABASE_PROJECT_ID="[MASCARADO: identificador interno do projeto]"
VITE_SUPABASE_PUBLISHABLE_KEY="[MASCARADO: chave anon/publicável que incorpora o identificador interno]"
VITE_SUPABASE_URL="https://[MASCARADO: identificador interno].supabase.co"
```

Classificação:
- `VITE_SUPABASE_PROJECT_ID`: configuração pública usada pelo cliente, mas o identificador interno não deve ser reproduzido em chat.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave `anon` publicável, não é uma chave administrativa nem `service_role`; foi mascarada porque incorpora o identificador interno.
- `VITE_SUPABASE_URL`: endereço público necessário ao cliente; foi mascarado porque expõe o identificador interno.

### `.env.development`

```dotenv
VITE_PAYMENTS_CLIENT_TOKEN="pk_test_51U5gLeQ5MLolmDKmcjzqPDFuKyet0p7t32Fzcg7Pp89Hyhcv8FXOeg0Mn1XDXv7bG3R9S3EsHIJ9Rumt0xqqeqnd00mfj4upV2"
```

Classificação: chave publicável de teste da Stripe. O prefixo `pk_test_` confirma que foi criada para uso no navegador; não é uma chave secreta `sk_`. O código atual só consulta se o valor começa com `test_`, portanto este valor antigo também merece revisão futura, pois o site hoje usa Asaas.

### `.env.production`

```dotenv
VITE_PAYMENTS_CLIENT_TOKEN="pk_live_51U5oABLGvKekBI8tBR7x1oDFIUodCut4ZoE1QNr3iM1AxuDyhdMDB7NEoEoMvWqvkgZ6I6dbmVXSoM2NTFxpLYjR00hDoaW5G3"
```

Classificação: chave publicável de produção da Stripe. O prefixo `pk_live_` confirma que foi criada para uso no navegador; não é uma chave secreta `sk_`. Também parece ser um rastro da integração anterior, porque o pagamento atual usa Asaas.

Conclusão deste levantamento: não apareceu chave privada administrativa, `service_role`, senha, segredo de webhook ou chave `sk_` nos três arquivos. Existem, porém, dois tokens publicáveis antigos da Stripe que devem ser avaliados separadamente antes de qualquer remoção.

## 2. Os 14 planos antigos

A classificação anterior foi revisada após a leitura integral dos arquivos e comparação com o código atual. Nenhum arquivo foi apagado.

### Os 10 antes classificados como “já concluídos”

1. **`atualização-do-texto-do-rodapé-2026-08-18.md`**  
   Trata da troca isolada do texto do rodapé por uma versão que ainda citava Stripe. Está superado, não apenas concluído: o rodapé atual está em `AppFooter` e já cita Asaas com outra redação.

2. **`corrigir-contraste-do-botão-entrar-como-cidadão-2026-08-20.md`**  
   Trata do contraste do botão “Entrar como Cidadão” em um bloco antigo da landing page. Está superado porque esse botão e o bloco descrito não existem mais na home atual.

3. **`reorganizar-o-menu-do-topo-appheader-2026-08-17.md`**  
   Propõe quatro links diretos, menu “Ferramentas” e menu de conta. Foi substituído pelo plano posterior de menu único; o cabeçalho atual segue a arquitetura posterior, com Calculadoras e Jurisprudência no primeiro nível.

4. **`um-único-menu-no-topo-logado-ou-não-2026-08-21.md`**  
   Unifica o cabeçalho da home e das demais páginas, mantendo variações apenas conforme a sessão. Está implementado: a home renderiza `AppHeader`, e o cabeçalho atual possui itens públicos, itens protegidos e redirecionamento para autenticação.

5. **`metadados-e-open-graph-das-páginas-mais-linkadas-2026-08-19.md`**  
   Trata de imagens sociais, metadados por página e JSON-LD. Está implementado: o componente SEO aceita imagem e texto alternativo, existem imagens para Home, Jurisprudência e Planos, e as tags Open Graph e Twitter estão presentes.

6. **`refinar-hierarquia-visual-espaçamento-e-responsividade-da-pá-2026-08-19.md`**  
   Trata da hierarquia e responsividade da tela de Análise. Está implementado: as escalas de título, alturas responsivas do campo e limites do texto extraído aparecem no código atual. Depois recebeu novos refinamentos tipográficos.

7. **`auditoria-de-veracidade-da-landing-page-2026-08-19.md`**  
   Audita a diferença entre consulta processual e jurisprudência, além da confiabilidade dos links de fonte. A auditoria em si foi concluída, mas suas correções foram apenas parcialmente absorvidas: a copy atual é mais prudente, porém o documento terminava pedindo uma decisão e não comprova que toda a rota recomendada foi executada. Deve ser tratado como referência histórica, não como tarefa integralmente concluída.

8. **`teste-das-calculadoras-com-dados-reais-pós-login-2026-08-16.md`**  
   Define testes reais para correção monetária e prazo processual, sem alteração de código. A classificação anterior como concluído não pode ser confirmada pelo repositório: não há relatório persistente com os resultados descritos. É um roteiro antigo de teste, possivelmente executado, mas sem prova documental local.

9. **`página-com-redirecionamento-no-search-console-2026-08-23.md`**  
   Explica que URLs alternativas redirecionadas não representam erro de indexação e recomenda uma ação no Search Console. A parte de código não exigia mudança e o domínio canônico atual está coerente. A validação feita dentro do Search Console não pode ser comprovada pelo repositório.

10. **`coerência-da-vitrine-ponte-do-gratuito-para-o-pago-2026-08-20.md`**  
    Reúne ajustes de copy, teste grátis e passagem do cálculo para a petição. A ponte “Gerar petição com este valor” e o aviso dos sete dias existem hoje, mas as partes de pagamento e rodapé baseadas em Stripe foram superadas pela migração para Asaas. É parcialmente implementado e parcialmente obsoleto.

### Os 4 antes classificados como “duplicados ou substituídos”

11. **`plano-diagnosticar-e-destravar-o-paddle-no-prezado-ai-2026-08-17.md`**  
    Trata de liberar o domínio, a conta e o checkout no Paddle. Está integralmente superado: não há mais integração Paddle e o pagamento atual usa Asaas. Não é apenas duplicado; registra uma estratégia abandonada.

12. **`situação-do-dns-de-honorifico-com-br-2026-08-17.md`**  
    Registra o diagnóstico de DNS ainda não publicado e passos no Registro.br, incluindo uma alternativa temporária para destravar o Paddle. A parte de DNS está resolvida, pois o domínio Honorífico é hoje o canônico em metadados e sitemap. A parte sobre Paddle ficou obsoleta.

13. **`calculadoras-jurídicas-mapeamento-dos-sites-de-referência-e-2026-08-17.md`**  
    É um roadmap amplo inspirado em PrazoFácil e DrCalc. Algumas entregas existem hoje, como CPF/CNPJ, operações com datas e páginas próprias de calculadoras; outras, como PRICE/SAC, desapropriação e câmbio, não aparecem implementadas. Não deve ser chamado de duplicado: é um roadmap parcialmente executado e ainda guarda ideias não realizadas.

14. **`correção-de-rota-estado-atual-e-o-que-falta-2026-08-20.md`**  
    É um relatório intermediário sobre a refatoração das calculadoras e uma decisão entre manter ou reverter ajustes já antecipados. A extração proposta foi concluída: hoje existem `CurrencyInput`, `StepIndicator`, `ResultCard` e `MemoriaList`. O arquivo foi substituído pelo estado posterior do código, mas documenta decisões técnicas úteis.
