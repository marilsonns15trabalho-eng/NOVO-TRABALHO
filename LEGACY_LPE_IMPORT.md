# Importacao do banco legado LPE

## Escopo final desta migracao

Esta migracao foi reduzida para exatamente o que voce pediu:

- importar somente os `47` alunos aproveitaveis
- criar acesso apenas para alunos com e-mail valido
- senha inicial de todos os acessos: `123456`
- nao importar:
  - planos
  - assinaturas
  - boletos
  - pagamentos
  - dividas
  - despesas
  - avaliacoes
  - anamneses
  - treinos

Voce vai organizar os planos manualmente depois dentro do sistema novo.

## Auditoria do banco legado

- `66` alunos no total
- `47` alunos com e-mail valido e sem duplicidade
- `19` alunos sem e-mail ou sem condicao segura de criar acesso
- `0` grupos de e-mail duplicado no legado

## O que o importador grava

- `auth.users`
- `public.user_profiles`
- `public.students`

## Campos aproveitados do legado

- nome
- e-mail
- telefone
- cpf
- data de nascimento
- genero
- profissao
- cep
- endereco
- cidade
- contato de emergencia
- telefone de emergencia
- data de cadastro
- status
- observacoes
- objetivos
- peso desejado
- grupo
- modalidade

## Campos descartados nesta importacao

- plano atual
- assinatura
- valor pago
- vencimento
- pagamentos
- boletos
- despesas
- anamnese
- avaliacao
- treinos

## Senha inicial

Todos os alunos importados com acesso entram com:

```text
123456
```

Tambem entram com `must_change_password = true`.

## Pre-requisito

Rode antes:

- [phase3_11_legacy_lpe_import_support.sql](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/phase3_11_legacy_lpe_import_support.sql)

## Como rodar pelo painel

Depois de rodar a migration:

1. entre como admin
2. abra `Configuracoes`
3. use `Simular importacao`
4. depois use `Importar 47 alunos`

Esse fluxo usa a rota server-side:

- [app/api/admin/import-legacy-lpe-students/route.ts](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/app/api/admin/import-legacy-lpe-students/route.ts)

e importa os dados fixos de:

- [data/legacy-lpe-students.json](c:/Users/maril/OneDrive/Documentos/GitHub/NOVO-TRABALHO/data/legacy-lpe-students.json)

## Opcional pelo terminal

Se depois quiser manter a opcao por terminal:

```powershell
python scripts/import_legacy_lpe.py --db "c:\LPE\data\lpe_database.db"
python scripts/import_legacy_lpe.py --db "c:\LPE\data\lpe_database.db" --execute
```

## Relatorio gerado

O script gera:

- `legacy_lpe_import_report.json`

Esse arquivo mostra:

- quantos alunos foram importados
- quais alunos entraram
- quais foram ignorados por falta de e-mail valido
