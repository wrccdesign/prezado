ALTER TABLE public.ai_usage
  ADD COLUMN IF NOT EXISTS reasoning_tokens integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_usd numeric(14,8);

CREATE TABLE IF NOT EXISTS public.ai_model_prices (
  model text PRIMARY KEY,
  input_usd_per_mtok numeric(12,6) NOT NULL,
  output_usd_per_mtok numeric(12,6) NOT NULL,
  effective_from date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_model_prices TO authenticated;
GRANT ALL ON public.ai_model_prices TO service_role;
ALTER TABLE public.ai_model_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem precos de modelo"
  ON public.ai_model_prices FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins gerenciam precos de modelo"
  ON public.ai_model_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ai_model_prices_updated_at
  BEFORE UPDATE ON public.ai_model_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem configuracoes de IA"
  ON public.ai_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins gerenciam configuracoes de IA"
  ON public.ai_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ai_model_prices (model, input_usd_per_mtok, output_usd_per_mtok, notes) VALUES
  ('gemini-3.6-flash', 0.30, 2.50, 'ai.google.dev/gemini-api/docs/pricing'),
  ('gemini-3.5-flash', 0.30, 2.50, 'ai.google.dev/gemini-api/docs/pricing'),
  ('gemini-3.5-flash-lite', 0.10, 0.40, 'ai.google.dev/gemini-api/docs/pricing'),
  ('gemini-3.1-flash-lite', 0.10, 0.40, 'ai.google.dev/gemini-api/docs/pricing')
ON CONFLICT (model) DO NOTHING;

INSERT INTO public.ai_settings (key, value) VALUES ('usd_brl', '5.40')
ON CONFLICT (key) DO NOTHING;

DROP FUNCTION IF EXISTS public.ai_usage_summary(integer);
CREATE FUNCTION public.ai_usage_summary(p_days integer DEFAULT 30)
 RETURNS TABLE(dia date, function_name text, chamadas bigint, falhas bigint, input_tokens bigint, output_tokens bigint, reasoning_tokens bigint, custo_usd numeric, sem_preco bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    (u.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
    u.function_name,
    count(*) AS chamadas,
    count(*) FILTER (WHERE u.success IS FALSE) AS falhas,
    COALESCE(sum(u.input_tokens), 0)::bigint AS input_tokens,
    COALESCE(sum(u.output_tokens), 0)::bigint AS output_tokens,
    COALESCE(sum(u.reasoning_tokens), 0)::bigint AS reasoning_tokens,
    COALESCE(sum(u.cost_usd), 0)::numeric AS custo_usd,
    count(*) FILTER (
      WHERE u.success IS TRUE
        AND NOT EXISTS (SELECT 1 FROM public.ai_model_prices p WHERE p.model = u.model)
    ) AS sem_preco
  FROM public.ai_usage u
  WHERE public.has_role(auth.uid(), 'admin')
    AND u.created_at >= now() - make_interval(days => greatest(1, least(p_days, 180)))
  GROUP BY 1, 2
  ORDER BY 1 DESC, custo_usd DESC;
$function$;

REVOKE ALL ON FUNCTION public.ai_usage_summary(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ai_usage_summary(integer) TO authenticated, service_role;