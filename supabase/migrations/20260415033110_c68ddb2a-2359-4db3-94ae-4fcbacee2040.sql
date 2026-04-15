
-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  paddle_subscription_id text UNIQUE,
  paddle_customer_id text,
  product_id text,
  price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, environment)
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_id ON public.subscriptions(paddle_subscription_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Security definer function to get user plan without RLS issues
CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id uuid, p_env text DEFAULT 'live')
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan_id FROM public.subscriptions
     WHERE user_id = p_user_id
       AND environment = p_env
       AND status IN ('active', 'trialing')
       AND (current_period_end IS NULL OR current_period_end > now())
     LIMIT 1),
    'free'
  );
$$;

-- Update handle_new_user to also create free subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, profile_type) VALUES (NEW.id, 'cidadao');
  INSERT INTO public.subscriptions (user_id, plan_id, status, environment)
  VALUES (NEW.id, 'free', 'active', 'sandbox');
  INSERT INTO public.subscriptions (user_id, plan_id, status, environment)
  VALUES (NEW.id, 'free', 'active', 'live');
  RETURN NEW;
END;
$$;
