

# Plan: 3 Database Sanity Fixes

## ITEM 1 — Fix tribunal normalization

**Current state:** 5 records have malformed tribunal values (`"STJ, UF: DF"`, `"STJ, SE"`, `"TST, uf: DF, uf:"`, `"STJ, GABINETE DO MINISTRO JOÃO OTÁVIO DE NORONHA"`).

**Changes:**

1. **`supabase/functions/ingest-datajud/index.ts`** — Update the `EXTRACTION_SYSTEM_PROMPT` to add an explicit rule:
   ```
   - tribunal: APENAS a sigla oficial (ex: TJSP, STJ, TST, TRT2, TRF1). 
     NUNCA inclua UF, nome do gabinete, ou qualquer texto além da sigla.
     Exemplos: "STJ" (não "STJ, UF: DF"), "TJSP" (não "Tribunal de Justiça de São Paulo")
   ```
   Also update the tool description for `tribunal` to reinforce: `"Sigla OFICIAL do tribunal, apenas letras e números (ex: TJSP, STJ, TST, TRT2). Sem UF, sem nome extenso."`

2. **Data cleanup** — UPDATE the 5 malformed records:
   - `"STJ, UF: DF"` → `"STJ"`
   - `"STJ, SE"` → `"STJ"`
   - `"TST, uf: DF, uf:"` → `"TST"`
   - `"STJ, GABINETE DO MINISTRO JOÃO OTÁVIO DE NORONHA"` → `"STJ"`

---

## ITEM 2 — Add `orgao_julgador` column

**Migration SQL:**
```sql
ALTER TABLE decisions ADD COLUMN orgao_julgador TEXT;
```

**Code changes in `ingest-datajud/index.ts`:**
- Add `orgao_julgador` to the `EXTRACTION_TOOL` properties: `{ type: "string", description: "Câmara, turma ou órgão julgador (ex: '3ª Câmara Cível', '2ª Turma')" }`
- Add `orgao_julgador` to the insert object: `orgao_julgador: metadata.orgao_julgador || source.orgaoJulgador?.nome || null`

---

## ITEM 3 — Deduplicate + UNIQUE constraint on `numero_processo`

**Current state:** No duplicates exist. All 66 records have non-null `numero_processo`. Safe to add constraint directly.

**Migration SQL:**
```sql
ALTER TABLE decisions ADD CONSTRAINT decisions_numero_processo_unique UNIQUE (numero_processo);
```

**Code change in `ingest-datajud/index.ts`:**
- Replace the current "check for duplicates by external_id then INSERT" logic with an UPSERT approach:
  - Use `.upsert()` with `onConflict: 'numero_processo'` instead of separate select + insert
  - The upsert should update fields only when the new data is more complete (non-null values replace nulls)
  - Keep the `external_id` duplicate check as a fast pre-filter (avoids unnecessary AI calls)

---

## Files modified
1. `supabase/functions/ingest-datajud/index.ts` — prompt fix, add orgao_julgador to tool + insert, upsert logic
2. Database migration — add `orgao_julgador` column + unique constraint
3. Data update — clean 5 malformed tribunal records

