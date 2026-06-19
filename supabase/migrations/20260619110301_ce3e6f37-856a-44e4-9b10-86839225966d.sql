CREATE TABLE public.period_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, start_date),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.period_logs TO authenticated;
GRANT ALL ON public.period_logs TO service_role;

ALTER TABLE public.period_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own period logs" ON public.period_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER period_logs_touch_updated_at
  BEFORE UPDATE ON public.period_logs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX period_logs_user_start_idx ON public.period_logs (user_id, start_date DESC);

-- Seed existing users' last_period_start into the new table
INSERT INTO public.period_logs (user_id, start_date)
SELECT user_id, last_period_start FROM public.cycle_settings
ON CONFLICT (user_id, start_date) DO NOTHING;