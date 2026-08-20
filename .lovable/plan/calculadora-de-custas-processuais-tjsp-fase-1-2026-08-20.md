# Calculadora de Custas Processuais — TJSP (fase 1)

Nós calculamos e fundamentamos. A emissão e o pagamento acontecem exclusivamente no portal do tribunal. Nenhuma tela usará "emitir" como ação nossa, e nenhum código de barras será gerado.

## 1. Banco de dados

Duas tabelas novas, ambas com leitura pública (dados normativos) e escrita restrita ao service role, com GRANTs explícitos.

**`unidades_fiscais`** — `codigo`, `ano`, `valor`, `fonte_normativa`, `vigencia_inicio`, UNIQUE(codigo, ano).
Sementes: UFESP 2024 = 35,36 | 2025 = 37,02 | 2026 = 38,42 (vigente 01/01/2026).

**`custas_regras`** — `tribunal`, `uf`, `tipo_ato`, `base_calculo`, `aliquota`, `valor_fixo_qtd`, `unidade_fiscal`, `piso_qtd`, `teto_qtd`, `tipo_guia`, `codigo_receita`, `url_emissao`, `vigencia_inicio`, `vigencia_fim`, `fonte_normativa`, `observacoes`.

Sementes TJSP (DARE-SP, receita 230-6, piso 5 / teto 3.000 UFESPs, salvo agravo):

| tipo_ato | base | valor | vigência |
|---|---|---|---|
| distribuicao_acao | valor da causa | 1,0% | 01/01/2004 – 02/01/2024 |
| distribuicao_acao | valor da causa | 1,5% | a partir de 03/01/2024 |
| execucao_titulo_extrajudicial | valor da causa | 2,0% | a partir de 03/01/2024 |
| cumprimento_sentenca | valor do crédito | 2,0% | a partir de 03/01/2024 |
| preparo_apelacao | condenação líquida ou causa atualizada | 4,0% | a partir de 03/01/2024 |
| agravo_instrumento | fixo | 10 UFESPs → 15 UFESPs | corte em 03/01/2024 |

Fonte: Lei Estadual 11.608/2003, com redação da Lei 17.785/2023.

## 2. Motor de cálculo e edge function

O cálculo puro fica em `supabase/functions/_shared/custas-engine.ts` (sem dependências de runtime), e a edge function `calcular-custas` cuida de auth, cota e leitura do banco. Assim os testes rodam sobre a mesma função que a produção usa.

Regras implementadas:

1. **Vigência**: escolhe a regra vigente na `data_ato` (não a mais recente) e registra na memória qual regra foi aplicada.
2. **UFESP correta**: usa a UFESP vigente no primeiro dia do mês do recolhimento — não a do ajuizamento nem a do ano corrente.
3. **Piso e teto**: percentual calculado e depois travado entre 5 e 3.000 UFESPs, com a memória explicitando quando o piso ou o teto foi o que definiu o valor (ex.: causa de R$ 5.000 → 1,5% = R$ 75,00 → devido R$ 192,10 pelo piso, UFESP 2026).
4. **Isenções**: qualquer flag (`justica_gratuita`, `parte_isenta`, `natureza_isenta`) zera o devido com a fundamentação — art. 5º, LXXIV da CF e art. 98 do CPC; art. 6º da Lei 11.608/2003 para entes públicos e MP; natureza isenta para menores, acidente do trabalho, alimentos até 2 salários mínimos e Juizados Especiais em 1ª instância.
5. **Litisconsórcio ativo voluntário**: +10 UFESPs por grupo de 10 autores ou fração excedente.
6. **Retorno**: valor devido, memória linha a linha, UFESP usada (ano e vigência), fonte normativa, tipo de guia, código de receita e URL de emissão.

Autenticação obrigatória e `checkRateLimit` com a ação `calculo` já existente (sem modo convidado nesta calculadora). Registro em `supabase/config.toml`.

## 3. Componente `CustasCalc.tsx`

Três etapas, no padrão visual das calculadoras atuais.

**Etapa 1 — ato**: cards clicáveis: Distribuir ação · Distribuir execução de título extrajudicial · Instaurar cumprimento de sentença · Preparo de apelação · Agravo de instrumento.

**Etapa 2 — dados**: valor base, data do ato (hoje por padrão), número de autores (só quando relevante) e as três caixas de isenção com explicação curta. No campo de valor, o link "atualizar este valor" abre a Correção Monetária existente e devolve o valor corrigido como base — o preparo incide sobre o valor atualizado.

**Etapa 3 — resultado**:
- (a) valor devido em destaque, memória de cálculo expansível e base legal;
- (b) bloco "Atenção — outras guias": a DARE cobre só a taxa judiciária; despesas processuais vão em FEDTJ e diligências de oficial de justiça em GRD;
- (c) botão que abre o Portal de Custas do TJSP em nova aba, com valor e código de receita 230-6 ao lado para copiar, e o aviso de que a DARE vence em 5 dias corridos da emissão, prorrogando para o primeiro dia útil seguinte.

Salvar o cálculo e exportar em PDF reaproveitando `exportDocument.ts`. Rodapé fixo deixando claro que o Honorífico calcula e fundamenta, mas a emissão e o pagamento são feitos apenas no portal do tribunal e o valor deve ser conferido no ato da emissão.

Entra também no grid de `/calculadoras`.

## 4. Integração com prazo

Em `PrazoCalc`, quando o tipo de prazo for recursal (apelação, agravo, recurso ordinário), aparece um aviso de que o preparo deve ser recolhido dentro do mesmo prazo, com link para a calculadora de custas.

## 5. Landing SEO

Nova rota `/calculadoras/custas-tjsp` usando o `CalculatorLanding` existente, com conteúdo sobre alíquotas por ato, piso e teto em UFESPs, isenções, as três guias do TJSP (DARE, FEDTJ, GRD) e o vencimento da DARE. Rota registrada em `App.tsx` e adicionada ao `sitemap.xml`.

## 6. Validação antes de publicar

`src/test/custas.test.ts` (vitest) importando o motor puro, com no mínimo 10 casos e resultado esperado calculado à mão: piso, teto, faixa intermediária, ato anterior a 03/01/2024 (1%), ato posterior (1,5%), execução extrajudicial, cumprimento de sentença, preparo sobre condenação, agravo fixo (10 e 15 UFESPs conforme a data) e litisconsórcio. A suíte roda antes de qualquer publicação.

## Extensibilidade

Nada de TJSP fica no código: alíquotas, guias, pisos, tetos e URLs vivem em `custas_regras`, e a unidade fiscal em `unidades_fiscais`. TJRJ, TJMG, TJRS e Justiça Federal entram depois só com novas linhas nessas tabelas.

## Ponto a confirmar

Os valores de UFESP e as alíquotas foram informados por você e serão gravados como fornecidos, com a fonte normativa registrada em cada linha. Se quiser, valido cada valor contra a fonte oficial antes de semear.
