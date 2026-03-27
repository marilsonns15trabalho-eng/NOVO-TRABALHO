-- ============================================================
-- FASE 2.10D - ANALYZE
-- Executar por ultimo, somente quando o projeto estiver mais estavel.
-- ============================================================

SET search_path = public;

ANALYZE public.user_profiles;
ANALYZE public.financeiro;
ANALYZE public.bills;
