ALTER TABLE public.tournament_scores
  ADD COLUMN IF NOT EXISTS competition_scope text NOT NULL DEFAULT 'GLOBAL',
  ADD COLUMN IF NOT EXISTS competition_date date;

ALTER TABLE public.tournament_scores
  DROP CONSTRAINT IF EXISTS tournament_scores_competition_scope_check;
ALTER TABLE public.tournament_scores
  ADD CONSTRAINT tournament_scores_competition_scope_check
  CHECK (competition_scope IN ('GLOBAL', 'SCHOOL'));

CREATE INDEX IF NOT EXISTS tournament_scores_global_ranking_idx
  ON public.tournament_scores (competition_scope, competition_date, school_id, created_at);
CREATE INDEX IF NOT EXISTS tournament_scores_school_ranking_idx
  ON public.tournament_scores (competition_scope, school_id, student_id, created_at);
