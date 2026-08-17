UPDATE public.subscriptions
SET plan_id = 'escritorio',
    status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '1 year',
    cancel_at_period_end = false,
    updated_at = now()
WHERE user_id = 'e4dbce71-d452-4247-9186-85a1d99c5d7a'
  AND environment = 'live';