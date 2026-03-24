import sys
import os
import logging

# Adiciona o diretório raiz do projeto ao sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Configurar logging (do LPE)
log_dir = os.path.join(os.path.expanduser("~"), "Lioness Personal Estudio", "logs")
os.makedirs(log_dir, exist_ok=True)
log_file_path = os.path.join(log_dir, "lpe_errors.log")
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file_path),
        logging.StreamHandler()
    ]
)

logging.info("Início da execução do Lioness Personal Estúdio - PRIME")

# Importa e executa o módulo principal da UI
from src.ui.main_window import MainWindow

def main():
    logging.info("Iniciando aplicação MainWindow.")
    try:
        app = MainWindow()
        app.mainloop()
        logging.info("Aplicação finalizada.")
    except Exception as e:
        logging.error(f"Erro fatal na aplicação: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

