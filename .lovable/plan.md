

# Atualizar mapeamento completo de tribunais do DataJud

## Problema
O mapeamento atual em `ingest-datajud/index.ts` tem apenas ~20 tribunais. A documentação oficial lista 91 endpoints. O fallback genérico funciona para a maioria, mas os TREs usam hífen (`tre-ac`, `tre-sp`) que não é gerado pelo fallback.

## Mudança necessária
Atualizar a função `getDatajudEndpoint()` no arquivo `supabase/functions/ingest-datajud/index.ts` para incluir o mapeamento completo dos 91 tribunais.

### Tribunais a adicionar

**Tribunais Superiores** (falta 1):
- STM → `api_publica_stm`

**Justiça Estadual** (faltam 17):
- TJAC, TJAL, TJAM, TJAP, TJES, TJMA, TJMS, TJMT, TJPA, TJPB, TJPI, TJRN, TJRO, TJRR, TJSE, TJTO

**Justiça do Trabalho** (faltam 24):
- TRT1 a TRT24 → `api_publica_trt1` ... `api_publica_trt24`

**Justiça Eleitoral** (faltam 28 - usam hífen):
- TSE → `api_publica_tse`
- TRE-AC a TRE-TO → `api_publica_tre-ac` ... `api_publica_tre-to`

**Justiça Militar** (faltam 3):
- TJMMG, TJMRS, TJMSP

### Abordagem
Em vez de listar todos individualmente, usar lógica inteligente no fallback:
1. TREs: detectar padrão `tre-XX` ou `treXX` e mapear para `api_publica_tre-XX`
2. TRTs: detectar padrão `trtN` e mapear para `api_publica_trtN`
3. Demais: manter `api_publica_${sigla}` como fallback (já funciona)
4. Adicionar entradas explícitas para casos especiais (STM, TSE, STF, TJDFT, TJMs)

### Arquivo editado
- `supabase/functions/ingest-datajud/index.ts` — reescrever `getDatajudEndpoint()` com mapeamento completo

### Impacto
Nenhuma mudança de UI ou banco de dados. Apenas a edge function passa a aceitar todos os 91 tribunais como parâmetro.

