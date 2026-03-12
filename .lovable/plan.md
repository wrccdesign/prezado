

# Plano: Substituir Logo por Imagem em Todo o Site

## O que será feito

Copiar a imagem do logo (`prezado-ai.png`) para `src/assets/` e substituir o logo atual (ícone Scale + texto "JurisAI") pela imagem nos seguintes locais:

## Locais de alteração

1. **`src/components/AppHeader.tsx`** — Logo no header (desktop + tablet + mobile sheet headers)
   - Substituir o `<div>` com Scale icon + texto por `<img>` do logo
   - Altura: `h-8` no mobile, `h-9` no desktop

2. **`src/pages/Auth.tsx`** — Logo acima do formulário de login
   - Substituir o quadrado com Scale icon por `<img>` centralizada
   - Altura: `h-12`

3. **`src/pages/LandingPage.tsx`** — Navbar, hero status badge, footer
   - Navbar: substituir Scale + texto por imagem `h-8`
   - Footer: substituir Scale + texto por imagem `h-7`

4. **`src/components/AppFooter.tsx`** — Footer das páginas internas
   - Substituir Scale + texto por imagem `h-7`

## Abordagem técnica

- Copiar `user-uploads://prezado-ai.png` → `src/assets/logo.png`
- Importar com `import logo from "@/assets/logo.png"` em cada arquivo
- Usar `<img src={logo} alt="JurisAI" className="h-8" />` com tamanhos ajustados por contexto
- Remover imports não usados do `Scale` icon onde aplicável

