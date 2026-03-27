-- Executar no SQL Editor do Supabase (projeto umdquhtwunluqjzhfjza ou o seu)
-- 1) is_admin() + RLS avaliacoes (INSERT 403)
-- 2) opcional: reivindicar aluno com mesmo e-mail e user_id NULL (AuthContext)

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

DROP POLICY IF EXISTS "avaliacoes_all" ON avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_select" ON avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_insert" ON avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_update" ON avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_delete" ON avaliacoes;

CREATE POLICY "avaliacoes_select" ON avaliacoes FOR SELECT USING (
    user_id = auth.uid() OR is_admin()
);

CREATE POLICY "avaliacoes_insert" ON avaliacoes FOR INSERT WITH CHECK (
    user_id = auth.uid() OR is_admin()
);

CREATE POLICY "avaliacoes_update" ON avaliacoes FOR UPDATE USING (
    user_id = auth.uid() OR is_admin()
) WITH CHECK (
    user_id = auth.uid() OR is_admin()
);

CREATE POLICY "avaliacoes_delete" ON avaliacoes FOR DELETE USING (
    user_id = auth.uid() OR is_admin()
);

-- Aluno órfão: mesma linha students (email) sem user_id — permite UPDATE no primeiro login
-- FASE 1 de seguranca: user_id tornou-se imutavel em UPDATE.
-- Este script nao deve recriar a policy de claim legado.
DROP POLICY IF EXISTS "students_update_claim" ON students;
