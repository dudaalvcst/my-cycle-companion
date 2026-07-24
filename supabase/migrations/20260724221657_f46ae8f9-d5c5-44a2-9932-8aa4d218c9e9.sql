
-- agenda_events
CREATE TABLE public.agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_events TO authenticated;
GRANT ALL ON public.agenda_events TO service_role;
ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own agenda" ON public.agenda_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER agenda_events_touch BEFORE UPDATE ON public.agenda_events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- tasks
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- hair_care_logs
CREATE TABLE public.hair_care_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL,
  treatment_type text NOT NULL,
  product text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hair_care_logs TO authenticated;
GRANT ALL ON public.hair_care_logs TO service_role;
ALTER TABLE public.hair_care_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own hair" ON public.hair_care_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER hair_care_logs_touch BEFORE UPDATE ON public.hair_care_logs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- skincare_steps
CREATE TABLE public.skincare_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  time_of_day text NOT NULL,
  step_order integer NOT NULL DEFAULT 0,
  product text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skincare_steps TO authenticated;
GRANT ALL ON public.skincare_steps TO service_role;
ALTER TABLE public.skincare_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own skincare steps" ON public.skincare_steps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER skincare_steps_touch BEFORE UPDATE ON public.skincare_steps FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- skincare_checkins
CREATE TABLE public.skincare_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL,
  am_done boolean NOT NULL DEFAULT false,
  pm_done boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skincare_checkins TO authenticated;
GRANT ALL ON public.skincare_checkins TO service_role;
ALTER TABLE public.skincare_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own skincare checkins" ON public.skincare_checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER skincare_checkins_touch BEFORE UPDATE ON public.skincare_checkins FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
