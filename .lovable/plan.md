

# Nova Página "Calculadoras" com 4 Calculadoras Jurídicas

## Arquivos a criar/modificar

### 1. `src/pages/Calculators.tsx` (novo)
Página principal com layout de cards para as 4 calculadoras. Estado local controla qual calculadora está aberta. Ao clicar em um card, exibe o formulário da calculadora correspondente inline (abaixo dos cards). Botão "Voltar" para retornar à seleção.

**Cards:**
- Rescisão Trabalhista (Briefcase icon, azul escuro)
- Pensão Alimentícia (Users icon, azul escuro)
- Prazo Processual (Calendar icon, azul escuro)
- Correção Monetária e Juros (DollarSign icon, azul escuro)

**Calculadoras (componentes inline):**
- **Rescisão Trabalhista**: campos para salário, data admissão/demissão, tipo demissão, FGTS; calcula saldo salário, férias proporcionais, 13º, aviso prévio, multa FGTS
- **Pensão Alimentícia**: renda do alimentante, número de filhos, % (padrão 30%); calcula valor mensal
- **Prazo Processual**: data inicial, dias do prazo, tipo (úteis/corridos); calcula data final (pula fins de semana se úteis)
- **Correção Monetária**: valor original, data inicial/final, índice (IPCA/INPC/Selic), taxa de juros; calcula valor corrigido (simplificado)

### 2. `src/App.tsx`
Adicionar rota `/calculadoras` com ProtectedRoute.

### 3. `src/components/AppHeader.tsx`
Adicionar botão "Calculadoras" com ícone Calculator no menu de navegação.

