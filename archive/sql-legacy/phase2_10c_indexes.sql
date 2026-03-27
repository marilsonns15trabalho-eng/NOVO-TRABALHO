-- ============================================================
-- FASE 2.10C - INDICES DE PERFORMANCE
-- Executar depois de 2.10B.
-- ============================================================

SET search_path = public;

CREATE INDEX IF NOT EXISTS idx_financeiro_tipo_status_data_vencimento
    ON public.financeiro(tipo, status, data_vencimento);

CREATE INDEX IF NOT EXISTS idx_bills_status_due_date
    ON public.bills(status, due_date);
