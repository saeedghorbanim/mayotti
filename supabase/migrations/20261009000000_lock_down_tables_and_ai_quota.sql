-- Security hardening.
--
-- 1. The legacy `expenses` and `budget_limits` tables had RLS policies of
--    USING (true) / WITH CHECK (true), so anyone holding the public publishable
--    key could read, modify or delete every row. The app keeps all user data in
--    localStorage and never touches these tables, so remove all access to them.
--    (Tables are kept, not dropped, so no existing data is destroyed.)

DROP POLICY IF EXISTS "Allow all operations on budget_limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;

REVOKE ALL ON TABLE public.budget_limits FROM anon, authenticated;
REVOKE ALL ON TABLE public.expenses FROM anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'expenses'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.expenses;
  END IF;
END $$;

-- 2. Server-side monthly quota for the paid AI edge functions. Only the edge
--    functions (service role) can touch it: RLS is on with no policies, and the
--    counter function is not executable by anon/authenticated.

CREATE TABLE IF NOT EXISTS public.ai_usage (
  app_user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  period TEXT NOT NULL, -- 'YYYY-MM' in UTC
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (app_user_id, kind, period)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ai_usage FROM anon, authenticated;

-- Atomically consumes one unit of quota. Returns false when the limit is reached.
CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_app_user_id TEXT, p_kind TEXT, p_limit INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period TEXT := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
  v_count INTEGER;
BEGIN
  INSERT INTO public.ai_usage (app_user_id, kind, period, count)
  VALUES (p_app_user_id, p_kind, v_period, 1)
  ON CONFLICT (app_user_id, kind, period)
  DO UPDATE SET count = public.ai_usage.count + 1, updated_at = now()
  WHERE public.ai_usage.count < p_limit
  RETURNING count INTO v_count;

  RETURN v_count IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(TEXT, TEXT, INTEGER) TO service_role;
