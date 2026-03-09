

# Plano: Painel do Advogado Completo

## Resumo

Construir um painel completo com 5 abas (Dashboard, Clientes, Petições, Modelos, Configurações) usando tabs dentro da página `LawyerDashboard.tsx`. Requer novas tabelas no banco de dados e um storage bucket para logos.

## 1. Migrações de Banco de Dados

### Tabela `clients`
```sql
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  document text, -- CPF/CNPJ
  contact text,
  email text,
  area text, -- área do direito
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- RLS: user can CRUD own clients
```

### Tabela `petition_templates`
```sql
CREATE TABLE public.petition_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  area text,
  petition_type text NOT NULL,
  form_data jsonb DEFAULT '{}'::jsonb,
  generated_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.petition_templates ENABLE ROW LEVEL SECURITY;
```

### Adicionar `client_id` a `petitions`
```sql
ALTER TABLE public.petitions ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
```

### Adicionar campos de configuração a `profiles`
```sql
ALTER TABLE public.profiles
  ADD COLUMN office_address text,
  ADD COLUMN office_phone text,
  ADD COLUMN office_email text,
  ADD COLUMN office_logo_url text,
  ADD COLUMN formatting_preferences jsonb DEFAULT '{}'::jsonb;
```

### Storage bucket para logos
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('office-logos', 'office-logos', true);
-- RLS policy para upload/delete apenas pelo dono
```

## 2. Componentes do Frontend

Criar componentes separados para cada aba para manter o código organizado:

- `src/components/lawyer-dashboard/DashboardTab.tsx` -- Cards de resumo (conta clients, petitions do mês, analyses), gráfico de atividade com Recharts (já instalado), lista de últimas petições
- `src/components/lawyer-dashboard/ClientsTab.tsx` -- Lista de clientes, dialog para novo/editar cliente, ao clicar abre detalhes com histórico de petições/análises
- `src/components/lawyer-dashboard/PetitionsTab.tsx` -- Histórico completo com filtros (tipo, data, cliente), ações de visualizar, baixar PDF/DOCX, duplicar, excluir
- `src/components/lawyer-dashboard/TemplatesTab.tsx` -- CRUD de modelos, salvar petição como modelo
- `src/components/lawyer-dashboard/SettingsTab.tsx` -- Formulário com dados do escritório, upload de logo, preferências de formatação

## 3. Reescrever `LawyerDashboard.tsx`

Usar `Tabs` do Radix para as 5 seções. Layout com sidebar vertical em desktop e tabs horizontais em mobile.

## 4. Integração

- Na página de Petição, adicionar select de cliente (opcional) e select de modelo
- PDF/DOCX download reutiliza lógica existente em `PetitionResult`

## Ordem de Implementação

1. Executar migrações (tabelas + storage + RLS)
2. Criar os 5 componentes de aba
3. Reescrever LawyerDashboard com tabs
4. Atualizar types conforme necessário após migração

