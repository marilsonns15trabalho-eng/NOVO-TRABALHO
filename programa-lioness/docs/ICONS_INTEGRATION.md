# Integração de Ícones - Lioness Personal Estúdio PRIME

## Visão Geral

Este documento descreve como os ícones foram integrados ao sistema PRIME, permitindo que a aplicação tenha ícones personalizados em diferentes contextos.

## Arquivos de Ícones

O sistema espera encontrar os seguintes arquivos de ícone na raiz do projeto:

- `program_top_icon.png` - Ícone da janela principal (aparece na barra de título)
- `taskbar_icon.png` - Ícone da barra de tarefas do sistema operacional
- `desktop_icon.png` - Ícone para atalhos na área de trabalho
- `installer_icon.png` - Ícone usado durante a instalação

## Estrutura dos Arquivos Criados

### 1. Gerenciador de Ícones (`src/utils/icon_manager.py`)

Classe responsável por:
- Carregar os ícones automaticamente
- Fornecer interface para acessar os ícones
- Configurar ícones em janelas Tkinter
- Gerenciar caminhos e tratamento de erros

### 2. Janela Principal com Ícones (`src/ui/main_window_with_icons.py`)

Versão modificada da janela principal que:
- Importa e utiliza o gerenciador de ícones
- Configura automaticamente o ícone da janela
- Mantém toda a funcionalidade original

### 3. Script Principal com Ícones (`src/main_with_icons.py`)

Ponto de entrada alternativo que utiliza a versão com ícones da janela principal.

### 4. Instalador com Ícones (`installer/setup_with_icons.py`)

Script de empacotamento que:
- Suporta PyInstaller e cx_Freeze
- Inclui todos os ícones no executável final
- Cria atalhos na área de trabalho (Windows)
- Configura ícones do executável

## Como Usar

### Opção 1: Substituir Arquivos Existentes

Para integrar os ícones ao programa principal, você pode:

1. Substituir `src/ui/main_window.py` pelo conteúdo de `src/ui/main_window_with_icons.py`
2. Substituir `src/main.py` pelo conteúdo de `src/main_with_icons.py`

### Opção 2: Usar Versões Paralelas

Para manter o código original intacto:

1. Execute o programa com ícones usando: `python src/main_with_icons.py`
2. Use o instalador específico: `python installer/setup_with_icons.py`

## Instalação de Dependências

```bash
pip install -r requirements_icons.txt
```

## Empacotamento

### Com PyInstaller (Recomendado)

```bash
cd installer
python setup_with_icons.py
# Escolha opção 1
```

### Com cx_Freeze

```bash
cd installer
python setup_with_icons.py
# Escolha opção 2
```

## Especificações dos Ícones

Para melhor compatibilidade, recomenda-se:

- **Formato**: PNG com transparência
- **Tamanhos recomendados**:
  - `program_top_icon.png`: 32x32 ou 64x64 pixels
  - `taskbar_icon.png`: 16x16, 32x32, 48x48 pixels
  - `desktop_icon.png`: 48x48 ou 64x64 pixels
  - `installer_icon.png`: 48x48 ou 64x64 pixels

## Tratamento de Erros

O sistema foi projetado para funcionar mesmo se os ícones não estiverem presentes:

- Se um ícone não for encontrado, o sistema continuará funcionando normalmente
- Mensagens de aviso são registradas no log
- A aplicação não trava por causa de ícones ausentes

## Logs

Todas as operações relacionadas aos ícones são registradas no sistema de log existente do PRIME.

## Compatibilidade

- **Windows**: Suporte completo a todos os tipos de ícone
- **Linux**: Suporte ao ícone da janela principal
- **macOS**: Suporte básico (pode requerer ajustes específicos)

## Personalização

Para personalizar os ícones:

1. Substitua os arquivos PNG na raiz do projeto
2. Mantenha os nomes dos arquivos
3. Recompile/reempacote a aplicação

## Solução de Problemas

### Ícone não aparece na janela

- Verifique se o arquivo `program_top_icon.png` existe na raiz do projeto
- Verifique os logs para mensagens de erro
- Certifique-se de que o arquivo PNG é válido

### Erro durante empacotamento

- Instale as dependências: `pip install -r requirements_icons.txt`
- Verifique se todos os arquivos de ícone estão presentes
- Execute o instalador a partir do diretório correto

### Atalho na área de trabalho não é criado

- Instale as dependências do Windows: `pip install winshell pywin32`
- Execute como administrador se necessário
- Verifique se o executável foi criado com sucesso

