

# Plano: Unificar Visual das Páginas Internas com o Branding da Landing Page

## Problema

A landing page usa navy (#0a1628), dourado (#c9a84c) e cream (#f8f5ef) com tipografia Playfair Display / DM Sans. Após login, o AppHeader e as páginas usam `bg-card` (branco), `bg-background` (cinza claro) e o primary azul genérico — criando uma desconexão visual total.

## Solução

Redesenhar o **AppHeader** e ajustar os **CSS tokens** do tema light para que as páginas internas compartilhem a identidade visual da landing: header navy escuro, acentos dourados, fundo cream suave.

## Alterações

### 1. `src/index.css` — Ajustar tokens :root

Atualizar as variáveis CSS para alinhar com a paleta da landing:
- `--background`: cream claro (#f8f5ef → `36 33% 95%`)
- `--primary`: navy (#0a1628 → `218 56% 10%`) — botões ativos ficam navy
- `--primary-foreground`: cream claro
- `--accent`: gold (#c9a84c) — manter como já está
- `--card`: branco puro (manter, funciona sobre fundo cream)
- `--ring`: gold em vez de azul

### 2. `src/components/AppHeader.tsx` — Header navy com estilo da landing

- Fundo: `bg-[#0a1628]` com borda inferior dourada sutil
- Logo: ⚖️ com fundo dourado, texto branco, "AI" em dourado
- Badges e botões: estilos claros sobre fundo escuro
- Botões de nav: `text-white/70 hover:text-white`, ativo com `bg-white/10`
- Sheet mobile: fundo navy com textos claros

### 3. `src/components/LegalDisclaimer.tsx` — Ajuste de cores

Fundo ambar mais suave que combine com cream, sem alteração de conteúdo.

### 4. Páginas internas (Index, Diagnostico, etc.)

- Já usam `bg-background` — ao mudar o token para cream, todas se alinham automaticamente
- Cards brancos sobre fundo cream = harmonia visual
- Botões primary (agora navy) mantêm coerência

## Não será alterado
- Landing page, rotas, edge functions, banco de dados
- Lógica de nenhum componente
- Apenas cores e estilos visuais

