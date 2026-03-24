# Lioness Personal Estúdio - PRIME

Sistema completo de gestão para personal trainers, combinando as melhores funcionalidades dos projetos LPE e LionessPersonalEstudio_INTERFACE_CORRIGIDA.

## Características

- **Interface e Layout**: Baseado no LPE.zip com cores preto, branco e laranja
- **Estrutura de Arquivos**: Baseado no LionessPersonalEstudio_INTERFACE_CORRIGIDA(1).zip com arquitetura modular
- **Funcionalidades Completas**: Todas as funcionalidades de ambos os projetos originais

## Estrutura do Projeto

```
PRIME/
├── main.py                 # Ponto de entrada da aplicação
├── src/
│   ├── common/            # Módulos utilitários e de infraestrutura
│   │   └── db.py         # Gerenciamento de banco de dados
│   ├── data/             # DAOs e acesso a dados (do LPE)
│   ├── financial/        # Módulos financeiros (do LPE)
│   ├── gui/              # Módulos de interface gráfica (do LPE)
│   ├── integrations/     # Integrações externas
│   ├── models/           # Modelos de dados (do LPE)
│   ├── modules/          # Módulos de negócio (estrutura do LionessPersonalEstudio)
│   │   ├── alunos/
│   │   ├── anamnese/
│   │   ├── avaliacao_fisica/
│   │   ├── configuracoes/
│   │   ├── financeiro/
│   │   ├── planos/
│   │   └── treinos/
│   └── ui/               # Interface principal
│       └── main_window.py
├── config/               # Configurações
├── database/            # Banco de dados SQLite
├── exports/             # Exportações
├── backups/             # Backups
├── attachments/         # Anexos
├── logs/                # Logs do sistema
└── tools/               # Ferramentas auxiliares
```

## Funcionalidades

### Gestão de Alunos
- Cadastro completo de alunos
- Edição e exclusão de registros
- Histórico de atividades

### Gestão Financeira
- Controle de pagamentos
- Gestão de despesas
- Geração de boletos e comprovantes
- Relatórios financeiros

### Gestão de Planos
- Criação e edição de planos de treinamento
- Associação de planos a alunos
- Controle de valores e durações

### Gestão de Treinos
- Criação de treinos personalizados
- Acompanhamento de exercícios
- Histórico de treinos

### Anamnese Nutricional
- Registro de informações de saúde
- Histórico médico
- Restrições alimentares

### Avaliação Física
- Medidas corporais
- Cálculo de IMC
- Acompanhamento de evolução

### Relatórios
- Relatórios de alunos
- Relatórios financeiros
- Gráficos e estatísticas

## Requisitos

- Python 3.11+
- tkinter (python3-tk)
- SQLite3
- matplotlib (para gráficos)

## Instalação

1. Extraia o arquivo ZIP
2. Instale as dependências:
   ```bash
   sudo apt-get install python3-tk
   pip install matplotlib
   ```

## Execução

```bash
python3 main.py
```

## Observações

- O programa foi testado em ambiente Linux
- Para execução em ambiente gráfico, certifique-se de que o DISPLAY está configurado
- O banco de dados SQLite é criado automaticamente na primeira execução
- Logs são salvos em `~/Lioness Personal Estudio/logs/`

## Versão

PRIME - Versão combinada dos melhores recursos dos projetos LPE e LionessPersonalEstudio_INTERFACE_CORRIGIDA

