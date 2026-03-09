
-- Create clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  document text,
  contact text,
  email text,
  area text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Create petition_templates table
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

CREATE POLICY "Users can view own templates" ON public.petition_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.petition_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.petition_templates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.petition_templates FOR DELETE USING (auth.uid() = user_id);

-- Add client_id to petitions
ALTER TABLE public.petitions ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Add office config columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN office_address text,
  ADD COLUMN office_phone text,
  ADD COLUMN office_email text,
  ADD COLUMN office_logo_url text,
  ADD COLUMN formatting_preferences jsonb DEFAULT '{}'::jsonb;

-- Create storage bucket for office logos
INSERT INTO storage.buckets (id, name, public) VALUES ('office-logos', 'office-logos', true);

-- Storage RLS policies
CREATE POLICY "Users can upload own logo" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'office-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own logo" ON storage.objects FOR UPDATE USING (bucket_id = 'office-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own logo" ON storage.objects FOR DELETE USING (bucket_id = 'office-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'office-logos');
