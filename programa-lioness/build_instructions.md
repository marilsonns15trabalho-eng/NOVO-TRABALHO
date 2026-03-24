# Instruções de Compilação - LINOESS PERSONAL ESTUDIO PRIME

## Comando para Compilar o Programa

Para compilar o programa Python em um executável usando PyInstaller, execute o seguinte comando no terminal do VS Code:

```bash
pyinstaller --onefile --windowed --icon="src/utils/program_top_icon.ico" --add-data "src;src" --add-data "data;data" --add-data "config;config" --add-data "exports;exports" --add-data "impressoes;impressoes" --add-data "logs;logs" --name="LINOESS_PERSONAL_ESTUDIO_PRIME" main.py
```

## Explicação dos Parâmetros:

- `--onefile`: Cria um único arquivo executável
- `--windowed`: Remove a janela do console (para aplicações GUI)
- `--icon`: Define o ícone do executável
- `--add-data`: Inclui diretórios e arquivos necessários no executável
- `--name`: Define o nome do arquivo executável final

## Estrutura de Diretórios Incluídos:

- `src`: Código fonte principal
- `data`: Banco de dados e arquivos de dados
- `config`: Arquivos de configuração
- `exports`: Diretório para exportações
- `impressoes`: Diretório para impressões
- `logs`: Diretório para logs do sistema

## Pós-Compilação:

Após a compilação, o executável será criado na pasta `dist/` com o nome `LINOESS_PERSONAL_ESTUDIO_PRIME.exe`.

## Observações:

1. Certifique-se de que o PyInstaller está instalado: `pip install pyinstaller`
2. Execute o comando a partir do diretório raiz do projeto
3. Todos os ícones e recursos necessários serão incluídos automaticamente
4. O executável final manterá a estrutura de diretórios necessária para o funcionamento correto do programa

