-- ============================================================
-- FASE 3.22 - LIBERACAO REAL DO DESAFIO PARA ALUNAS VINCULADAS
-- Rodar depois de phase3_19/20/21.
-- Objetivo:
--   * liberar o modulo desafio para qualquer aluna adicionada pelo admin
--   * manter bloqueado apenas quem nao participa
--   * preservar desafios arquivados fora do acesso da aluna
-- ============================================================

SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_current_student_access_challenge(target_challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.desafios d
        JOIN public.desafio_participantes dp
          ON dp.challenge_id = d.id
        WHERE d.id = target_challenge_id
          AND COALESCE(d.status, 'active') <> 'archived'
          AND dp.student_id = (SELECT public.current_student_id())
          AND dp.removed_at IS NULL
    );
$$;

REVOKE ALL ON FUNCTION public.can_current_student_access_challenge(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_current_student_access_challenge(UUID) TO authenticated;

ANALYZE public.desafios;
ANALYZE public.desafio_participantes;
ANALYZE public.desafio_dias;
