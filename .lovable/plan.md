

# Plano: Redesign Completo da Landing Page JurisAI

## Resumo

Criar uma landing page pública moderna em `src/pages/LandingPage.tsx` com as 10 seções solicitadas. A rota `/` será modificada: usuários não-autenticados veem a landing page, autenticados veem a página de análise (Index atual). Nenhuma alteração em rotas, edge functions ou banco de dados.

## Inventário de Features Existentes (para manter coerência)

- **Análise Jurídica** (`/`) - upload de documento + análise IA
- **Diagnóstico Jurídico** (`/diagnostico`) - linguagem simples para cidadãos
- **Geração de Petições** (`/peticao`) - 25 tipos de petição
- **Chat Jurídico** (`/chat`) - conversação com IA
- **Calculadoras** (`/calculadoras`) - Rescisão, Pensão, Prazo, Correção Monetária
- **Painel do Advogado** (`/painel-advogado`) - Dashboard, Clientes, Petições, Modelos, Configurações
- **Histórico** (`/historico`)
- **Perfis**: Cidadão e Advogado (com OAB)
- **Não existem planos/preços** definidos no sistema — a seção de Planos será "Em breve" ou omitida

## Alterações

### 1. Fontes (index.html)
Substituir Google Fonts import: `Playfair Display` + `DM Sans` em vez de Merriweather + Source Sans 3.

### 2. `src/index.css` e `tailwind.config.ts`
Atualizar variáveis de fonte para Playfair Display (títulos) e DM Sans (corpo).

### 3. `src/pages/LandingPage.tsx` (NOVO ~600 linhas)
Componente completo com as 10 seções inline:

1. **Navbar fixa** - `#0a1628`, logo ⚖️ JurisAI, links âncora, botões Entrar/Cadastrar (link para `/auth`)
2. **Hero** - grid dourado, duas colunas, badge animado, H1 com "todos" em dourado itálico, stats reais (25 tipos de petição, 4 calculadoras, Direito BR), card flutuante com features reais
3. **Barra legislação** - `#112240`, leis: CLT, Código Civil, CDC, CPC, Constituição Federal, Código Penal (referenciadas nas edge functions)
4. **Funcionalidades** - 6 cards: Análise Jurídica, Diagnóstico, Petições, Chat, Calculadoras, Painel Advogado
5. **Como Funciona** - 4 passos com linha dourada
6. **Para Quem** - 2 cards (Advogados / Cidadãos) com benefícios reais
7. **Depoimentos** - 3 cards fictícios realistas
8. **Planos** - Como não existem planos no sistema, mostrar 3 cards placeholder: Gratuito (features básicas), Profissional, Escritório — todos com botão "Começar Grátis" → `/auth`
9. **CTA Final** - "O direito nunca foi tão acessível"
10. **Footer** - 4 colunas

### 4. `src/App.tsx`
Modificar rota `/`:
- Se `user` → `<Index />` (análise, como está)
- Se não autenticado → `<LandingPage />`

Remover `ProtectedRoute` do `/` e adicionar lógica condicional.

### 5. Animações CSS
Adicionar em `index.css`:
- `@keyframes float` para card do hero
- `@keyframes pulse-dot` para badge
- Intersection Observer no componente para fade-in ao scroll

## Não será alterado
- Edge functions, banco de dados, rotas existentes, Auth, AppHeader (usado internamente), contextos

## Ordem
1. Atualizar fontes (index.html + CSS + tailwind config)
2. Criar LandingPage.tsx
3. Atualizar App.tsx para rota condicional

