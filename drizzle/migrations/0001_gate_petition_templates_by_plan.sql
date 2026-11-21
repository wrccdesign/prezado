DROP POLICY IF EXISTS "Users can insert own templates" ON public.petition_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.petition_templates;
CREATE POLICY "Escritorio users can insert own templates" ON public.petition_templates
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (public.get_user_plan(auth.uid(), 'live') = 'escritorio' OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Escritorio users can update own templates" ON public.petition_templates
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (public.get_user_plan(auth.uid(), 'live') = 'escritorio' OR public.has_role(auth.uid(), 'admin')));