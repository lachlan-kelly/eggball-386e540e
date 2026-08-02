CREATE TABLE public.eggball_profiles (
  id uuid NOT NULL PRIMARY KEY,
  name text NOT NULL DEFAULT 'Player',
  goals integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  games integer NOT NULL DEFAULT 0,
  hatricks integer NOT NULL DEFAULT 0,
  money integer NOT NULL DEFAULT 0,
  skin text NOT NULL DEFAULT 'default',
  explosion text NOT NULL DEFAULT 'none',
  anthem text NOT NULL DEFAULT 'anthem-none',
  ability text NOT NULL DEFAULT 'dash',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX eggball_profiles_name_idx ON public.eggball_profiles (lower(name));

GRANT SELECT, INSERT, UPDATE ON public.eggball_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.eggball_profiles TO authenticated;
GRANT ALL ON public.eggball_profiles TO service_role;

ALTER TABLE public.eggball_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" ON public.eggball_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can create a profile" ON public.eggball_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update a profile" ON public.eggball_profiles FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.eggball_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER eggball_profiles_updated_at BEFORE UPDATE ON public.eggball_profiles
FOR EACH ROW EXECUTE FUNCTION public.eggball_touch_updated_at();