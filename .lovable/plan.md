

# Corrigir bug de parsing de datas no ingest-datajud

## Problema
A IA (Gemini) retorna `data_decisao` em formatos como `"20251017000000"` ou `"20241003150030"`, causando erro Postgres `22008: date/time field value out of range`.

## Solução
Adicionar uma função `sanitizeDate()` em `supabase/functions/ingest-datajud/index.ts` que normaliza qualquer formato de data para `YYYY-MM-DD` antes da inserção.

### Função sanitizeDate
```typescript
function sanitizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Format: YYYYMMDDHHmmss or YYYYMMDD
  const match = raw.replace(/[-/\s:T]/g, "").match(/^(\d{4})(\d{2})(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.substring(0, 10);
  return null;
}
```

### Aplicar no insert
Substituir:
```typescript
data_decisao: metadata.data_decisao || source.dataAjuizamento || null,
```
Por:
```typescript
data_decisao: sanitizeDate(metadata.data_decisao) || sanitizeDate(source.dataAjuizamento) || null,
```

### Arquivo editado
- `supabase/functions/ingest-datajud/index.ts` — adicionar `sanitizeDate` e aplicar nos campos de data

