ALTER TABLE public.report_card
  ADD COLUMN IF NOT EXISTS school_id text REFERENCES public.school(id) ON DELETE CASCADE;

UPDATE public.report_card AS report_card
SET school_id = student.schoolid
FROM public.student AS student
WHERE report_card.school_id IS NULL
  AND report_card."studentId" = student.id;

UPDATE public.report_card AS report_card
SET school_id = student.schoolid
FROM public.student AS student
WHERE report_card.school_id IS NULL
  AND report_card."studentId" = student.admissionnumber;

CREATE INDEX IF NOT EXISTS report_card_school_status_created_idx
  ON public.report_card (school_id, status, "createdAt" DESC);

CREATE OR REPLACE FUNCTION public.can_read_school_report_card(card_school_id text, card_student_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT card_school_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public."user" AS actor
    JOIN public.user_role AS actor_role ON actor_role.userid = actor.id
    WHERE actor.id = auth.uid()::text
      AND (
        actor_role.role = 'SUPER_ADMIN'
        OR (
          actor_role.role IN ('ADMIN', 'SCHOOL_ADMIN')
          AND actor.schoolid = card_school_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.student AS learner
          WHERE learner.schoolid = card_school_id
            AND (learner.id = card_student_id OR learner.admissionnumber = card_student_id)
            AND (
              learner.userid = actor.id
              OR EXISTS (
                SELECT 1
                FROM public.parent AS linked_parent
                WHERE linked_parent.id = learner.parentid
                  AND linked_parent.userid = actor.id
                  AND linked_parent.schoolid = card_school_id
              )
              OR EXISTS (
                SELECT 1
                FROM public.teacher AS assigned_teacher
                JOIN public.teacher_on_subject AS assignment
                  ON assignment."teacherId" = assigned_teacher.id
                JOIN public."class" AS assigned_class
                  ON assigned_class.id = assignment."classId"
                WHERE assigned_teacher.userid = actor.id
                  AND assigned_teacher.schoolid = card_school_id
                  AND assigned_class."schoolId" = card_school_id
                  AND regexp_replace(upper(assigned_class.name), '[[:space:]]', '', 'g')
                    = regexp_replace(upper(learner.class), '[[:space:]]', '', 'g')
              )
            )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_school_report_card(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_school_report_card(text, text) TO authenticated;

ALTER TABLE public.report_card ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.report_card TO authenticated;
REVOKE ALL ON public.report_card FROM anon;

DROP POLICY IF EXISTS report_card_school_select ON public.report_card;
CREATE POLICY report_card_school_select ON public.report_card
FOR SELECT TO authenticated
USING (public.can_read_school_report_card(school_id, "studentId"));
