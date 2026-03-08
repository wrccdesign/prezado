
CREATE TABLE public.petitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  petition_type text NOT NULL,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_text text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own petitions" ON public.petitions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own petitions" ON public.petitions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own petitions" ON public.petitions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own petitions" ON public.petitions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
