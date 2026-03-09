

# Sistema de Perfis de Usuário — Cidadão vs Advogado

## Resumo
Criar uma tabela `profiles` no banco de dados para persistir o tipo de perfil (cidadão/advogado) e dados profissionais. Refatorar o `UserProfileContext` para ler/gravar do banco. Adicionar campos de advogado no cadastro. Condicionar UI ao perfil.

## 1. Migração — tabela `profiles`

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_type text NOT NULL DEFAULT 'cidadao' CHECK (profile_type IN ('cidadao', 'advogado')),
  oab_number text,
  oab_state text,
  specialties text[] DEFAULT '{}',
  office_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, profile_type) VALUES (NEW.id, 'cidadao');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 2. `src/contexts/UserProfileContext.tsx` — Refatorar

- Remove localStorage, reads from `profiles` table via Supabase
- Loads profile on auth state change (user_id)
- Exposes `profile`, `profileData` (full row with OAB, specialties, etc.), `isLawyer`, `updateProfile()`, `loading`
- `updateProfile` does an upsert to `profiles` table

## 3. `src/pages/Auth.tsx` — Campos de advogado no cadastro

- Add "Você é advogado?" Switch (only shown in signup mode)
- If yes, show conditional fields:
  - OAB Number (text) + OAB State (Select with all 27 UFs)
  - Specialties (checkboxes: Civil, Trabalhista, Criminal, Família, Tributário, Empresarial, Previdenciário, Ambiental)
  - Office name (optional text)
- On signup success, update the auto-created profile with these fields

## 4. `src/components/LegalDisclaimer.tsx` — Condicional

- Import `useUserProfile`
- If `isLawyer`, return `null` (hide disclaimer)

## 5. `src/components/AppHeader.tsx` — Menu condicional

- Remove the toggle button (profile now comes from DB, not toggleable)
- Show badge "Advogado" or "Cidadão" (read-only indicator)
- If `isLawyer`, show "Painel do Advogado" nav button (route `/painel-advogado`)

## 6. Nova página `src/pages/LawyerDashboard.tsx`

- Protected route, redirects to `/` if not lawyer
- Sections (placeholder cards for now):
  - "Gestão de Clientes" — placeholder
  - "Modelos Salvos" — placeholder
  - "Histórico de Petições" — link to `/historico`
  - Profile info card showing OAB, specialties, office

## 7. `src/App.tsx` — Nova rota

- Add `/painel-advogado` with ProtectedRoute wrapping `LawyerDashboard`

## Arquivos modificados/criados
- **Migration SQL** (1 migration)
- `src/contexts/UserProfileContext.tsx` (rewrite)
- `src/pages/Auth.tsx` (add lawyer fields)
- `src/components/LegalDisclaimer.tsx` (conditional render)
- `src/components/AppHeader.tsx` (remove toggle, add dashboard link)
- `src/pages/LawyerDashboard.tsx` (new)
- `src/App.tsx` (add route)

