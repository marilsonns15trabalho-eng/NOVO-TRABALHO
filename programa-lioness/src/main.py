import sys
import os
import logging

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

logging.info("Início da execução do Lioness Personal Estúdio - PRIME (com ícones)")

# Importar gerenciador de ícones
from src.utils.icon_manager import get_icon_manager

# Importa e executa o módulo principal da UI com suporte a ícones
from ui.main_window import MainWindow

def main():
    # Inicializar o gerenciador de ícones
    icon_manager = get_icon_manager()
    
    # Tentar definir o ícone da barra de tarefas (se aplicável ao SO)
    try:
        icon_manager.set_taskbar_icon()
    except Exception as e:
        logging.warning(f"Aviso: Não foi possível definir o ícone da barra de tarefas: {e}")

    logging.info("Iniciando aplicação MainWindow com suporte a ícones.")
    try:
        app = MainWindow()
        app.mainloop()
        logging.info("Aplicação finalizada.")
    except Exception as e:
        logging.error(f"Erro fatal na aplicação: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()