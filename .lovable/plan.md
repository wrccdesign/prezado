

# Integração com API de Legislação do Senado Federal

## Descoberta

A API do Portal da Legislação do Planalto **não é pública** (bloqueia acesso automatizado). Porém, o **Senado Federal** oferece uma API de Dados Abertos pública e sem autenticação:

- Base URL: `https://legis.senado.leg.br/dadosabertos`
- Documentação: https://legis.senado.leg.br/dadosabertos/docs/index.html

### Endpoints Relevantes
- `/legislacao/lista` - Lista normas com filtros (tipo, ano, termo)
- `/legislacao/{codigo}` - Detalhes completos de uma norma
- `/legislacao/tiposNorma` - Tipos disponíveis (Lei, Decreto, Emenda, etc.)

---

## Implementação

### 1. Nova Edge Function: `search-legislation`
Busca legislação na API do Senado por termo ou tipo de norma.

```
POST /search-legislation
Body: { termo: "trabalho", tipoNorma?: "LEI", ano?: 2024 }
Response: { normas: [...] }
```

### 2. Integrar nas Análises (`analyze-legal-text`)
Antes de chamar a IA:
1. Extrair palavras-chave do texto do usuário
2. Buscar legislação relacionada na API do Senado
3. Injetar os resultados no prompt como contexto adicional

Isso cria um sistema **RAG simplificado** onde a IA recebe dados atualizados.

### 3. Integrar nas Petições (`generate-petition`)
Mesmo padrão: buscar legislação relevante antes de gerar a petição.

### 4. Componente de Busca Manual (opcional)
Adicionar na UI uma busca para o usuário consultar legislação diretamente.

---

## Fluxo Técnico

```text
Texto do Usuário
       │
       ▼
┌─────────────────────┐
│ Extrair palavras-   │
│ chave (IA ou regex) │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Buscar na API do    │
│ Senado (até 5 leis) │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Montar prompt com   │
│ contexto legislativo│
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Chamar Gemini com   │
│ dados enriquecidos  │
└─────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/search-legislation/index.ts` | Criar - wrapper da API do Senado |
| `supabase/functions/analyze-legal-text/index.ts` | Modificar - integrar busca |
| `supabase/functions/generate-petition/index.ts` | Modificar - integrar busca |
| `supabase/config.toml` | Adicionar nova função |

---

## Limitações
- A API do Senado foca em legislação federal (não estadual/municipal)
- Rate limiting não documentado - implementar cache se necessário

