REVOKE ALL ON public.ai_usage FROM anon, authenticated;

COMMENT ON TABLE public.ai_usage IS 'Telemetria interna de custo de IA (tokens por função/modelo). Fechada por design: escrita e leitura apenas pelo service_role nas edge functions. O consumo visível ao usuário vem de public.usage_tracking, exposto pela função usage-summary. Não adicionar políticas nem grants para anon/authenticated.';