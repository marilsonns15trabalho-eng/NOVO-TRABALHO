-- ============================================================
-- FASE 2.07 - VALIDAÇÃO PÓS-CUTOVER
-- NÃO ALTERA DADOS — SOMENTE LEITURA
-- ============================================================

BEGIN;

SET LOCAL search_path = public;

-- ============================================================
-- 1. STUDENTS SEM VÍNCULO (CRÍTICO)
-- ============================================================

SELECT COUNT(*) AS students_sem_vinculo
FROM public.students
WHERE linked_auth_user_id IS NULL;

-- ============================================================
-- 2. DUPLICIDADE DE USUÁRIO
-- ============================================================

SELECT linked_auth_user_id, COUNT(*)
FROM public.students
WHERE linked_auth_user_id IS NOT NULL
GROUP BY linked_auth_user_id
HAVING COUNT(*) > 1;

-- ============================================================
-- 3. USERS COM PROFILE MAS SEM STUDENT
-- ============================================================

SELECT u.id
FROM auth.users u
LEFT JOIN public.students s
  ON s.linked_auth_user_id = u.id
WHERE s.id IS NULL;

-- ============================================================
-- 4. TESTE DE ACESSO CRUZADO (SIMULAÇÃO)
-- ============================================================

-- deve retornar ZERO
SELECT s1.id, s2.id
FROM public.students s1
JOIN public.students s2
  ON s1.id <> s2.id
WHERE s1.linked_auth_user_id = s2.linked_auth_user_id;

-- ============================================================
-- 5. DADOS ÓRFÃOS (SEM STUDENT VÁLIDO)
-- ============================================================

SELECT COUNT(*) FROM public.treinos t
LEFT JOIN public.students s ON s.id = t.student_id
WHERE s.id IS NULL;

SELECT COUNT(*) FROM public.avaliacoes a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE s.id IS NULL;

SELECT COUNT(*) FROM public.anamneses a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE s.id IS NULL;

SELECT COUNT(*) FROM public.assinaturas a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE s.id IS NULL;

COMMIT;
