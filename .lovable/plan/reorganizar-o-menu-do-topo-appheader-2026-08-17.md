# Reorganizar o menu do topo (AppHeader)

Hoje o cabeçalho mostra 11 links lado a lado no desktop, o que deixa a barra visualmente lotada e sem hierarquia. A proposta é reduzir para 4 itens diretos + 1 menu agrupado + 1 menu de conta.

## Nova estrutura

```text
[Logo]   Analisar · Diagnóstico · Petição · Jurisprudência   [Ferramentas ▾]   [avatar ▾]
```

**Diretos (ações principais do dia a dia)**
- Análise
- Diagnóstico
- Petição
- Jurisprudência

**Ferramentas (dropdown)**
- Chat Jurídico
- Calculadoras
- Modelos de Minutas
- Painel do Advogado (somente advogado)

**Menu de conta (dropdown no canto direito, com badge Cidadão/Advogado)**
- Minha Conta
- Histórico
- Planos
- Sair

## Comportamento

- O botão "Ferramentas" fica destacado (estado ativo) quando a rota atual pertence ao grupo.
- Badge de perfil (Cidadão/Advogado) sai da barra e passa para o topo do menu de conta, liberando espaço.
- Tablet (md–lg): mesmos 4 diretos, porém com rótulos ocultos abaixo de certo espaço; "Ferramentas" e conta seguem como dropdowns.
- Mobile (<768px): mantém o Sheet lateral, mas com as mesmas três seções nomeadas (Principais / Ferramentas / Conta), em vez da lista corrida atual.
- Nenhuma rota é removida — apenas reagrupada.

## Detalhes técnicos

- Alterar apenas `src/components/AppHeader.tsx`.
- Usar `@/components/ui/dropdown-menu` (já disponível) para os dois menus, estilizado com `bg-navy` + `border-gold/20` para manter a identidade.
- Reestruturar o array `navItems` em três grupos tipados (`primary`, `tools`, `account`), preservando a flag `lawyerOnly`.
- Estado ativo continua baseado em `location.pathname`; para o dropdown, ativo se algum item do grupo casar com a rota.
