CREATE TABLE public.eggball_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.eggball_feedback TO anon;
GRANT INSERT ON public.eggball_feedback TO authenticated;
GRANT ALL ON public.eggball_feedback TO service_role;

ALTER TABLE public.eggball_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
ON public.eggball_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (true);