
CREATE POLICY "insert own logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
