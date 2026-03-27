# Fase 3 - Projeto Novo do Zero

Objetivo: reconstruir o Supabase em paralelo, sem o legado que hoje causa sobrecarga, loops de auth e RLS caro.

## Ordem de execucao

1. Criar um projeto novo no Supabase.
2. Rodar [phase3_01_clean_schema.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_01_clean_schema.sql).
3. Rodar [phase3_02_clean_auth_rls.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_02_clean_auth_rls.sql).
4. Rodar [phase3_03_clean_indexes.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_03_clean_indexes.sql).
5. Recriar os usuarios no Auth do projeto novo.
6. Preencher `migration.user_id_map` com o mapeamento `legacy_user_id -> new_auth_user_id`.
7. Importar as tabelas do projeto antigo para um schema `legacy`.
8. Rodar [phase3_04_migrate_from_legacy_snapshot.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_04_migrate_from_legacy_snapshot.sql).
9. Rodar [phase3_05_validate_new_project.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_05_validate_new_project.sql).
10. Atualizar `.env` do frontend para apontar para o projeto novo e publicar.
11. Somente depois do cutover, desligar o projeto antigo.

## Caminho simplificado

Se voce nao quiser migrar os usuarios antigos para o Auth novo, use este fluxo:

1. Criar um unico usuario admin no Auth do projeto novo.
2. Rodar [phase3_03e_bootstrap_primary_admin.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_03e_bootstrap_primary_admin.sql).
3. Importar as tabelas antigas para um schema `legacy`.
4. Rodar [phase3_04_simple_migrate_business_data.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_04_simple_migrate_business_data.sql).
5. Rodar [phase3_05_validate_clean_start.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_05_validate_clean_start.sql).
6. Publicar o frontend apontando para o projeto novo.

Nesse modo:

- Os dados do negocio sao migrados.
- Os usuarios antigos nao sao recriados.
- `students.linked_auth_user_id` fica vazio no import inicial.
- O acesso administrativo funciona com o admin novo.
- O acesso de alunos pode ser vinculado depois com [phase3_06_link_students_by_new_auth_email.sql](/c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_06_link_students_by_new_auth_email.sql).

## O que muda nesse desenho

- Nenhuma tabela relacional nova usa `user_id`.
- O vinculo do aluno fica em `students.linked_auth_user_id`.
- A autoria administrativa fica em `students.created_by_auth_user_id`.
- `user_profiles` vira camada leve de role, com trigger de bootstrap no `auth.users`.
- O frontend passa a ler profile via RPC `get_my_profile()`, e nao via `select *` repetido em `user_profiles`.
- O RLS usa `student_id`, `linked_auth_user_id` e checks simples com `auth.uid()` encapsulado em `SELECT`.

## Como preencher `migration.user_id_map`

Depois de recriar os usuarios no projeto novo, insira um registro para cada usuario antigo:

```sql
insert into migration.user_id_map (
  legacy_user_id,
  new_auth_user_id,
  email,
  legacy_role,
  notes
)
values (
  'legacy-user-uuid',
  'new-auth-user-uuid',
  'usuario@exemplo.com',
  'aluno',
  'mapeado manualmente'
);
```

## Export/import recomendado

- Exportar do projeto antigo somente as tabelas do schema `public`.
- Importar essas tabelas para um schema `legacy` no projeto novo.
- Nao copiar `auth.*` diretamente.
- Recriar usuarios no Auth novo e usar `migration.user_id_map` para reconectar os IDs.

## Ponto importante

Se o projeto antigo estiver instavel, trate-o como fonte de leitura para exportar dados e nao como ambiente para continuar evoluindo schema.
