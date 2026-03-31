-- ============================================================
-- FASE 3.14 - LIMPEZA DE BOLETOS DE ADMIN E PROFESSOR
-- Opcional.
-- Rode no SQL Editor caso queira apagar boletos antigos
-- que ja tenham sido gerados para usuarios com role
-- admin ou professor.
-- ============================================================

SET search_path = public;

DELETE FROM public.bills b
USING public.students s
JOIN public.user_profiles up
  ON up.id = s.linked_auth_user_id
WHERE b.student_id = s.id
  AND up.role IN ('admin', 'professor');
