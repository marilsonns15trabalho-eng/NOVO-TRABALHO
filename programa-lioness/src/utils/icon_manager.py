"""
Módulo para gerenciamento de ícones da aplicação PRIME.
Responsável por carregar e configurar os ícones para diferentes contextos:
- Ícone da janela (program_top_icon.png)
- Ícone da barra de tarefas (taskbar_icon.png)
- Ícone do desktop (desktop_icon.png)
- Ícone do instalador (installer_icon.png)
"""

import os
import tkinter as tk
from tkinter import PhotoImage
import logging

class IconManager:
    """Classe responsável pelo gerenciamento de ícones da aplicação."""
    
    def __init__(self, base_path=None):
        """
        Inicializa o gerenciador de ícones.
        
        Args:
            base_path (str): Caminho base onde estão localizados os ícones.
                           Se None, usa o diretório raiz do projeto.
        """
        if base_path is None:
            # Determina o caminho base automaticamente (pasta src/utils)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.base_path = current_dir
        else:
            self.base_path = base_path
            
        self.icons = {}
        self._load_icons()
    
    def _load_icons(self):
        """Carrega todos os ícones disponíveis."""
        icon_files = {
            'program_top': 'program_top_icon.png',
            'taskbar': 'taskbar_icon.png', 
            'desktop': 'desktop_icon.png',
            'installer': 'installer_icon.png'
        }
        
        for icon_name, filename in icon_files.items():
            icon_path = os.path.join(self.base_path, filename)
            if os.path.exists(icon_path):
                try:
                    # Carrega o ícone como PhotoImage para uso no Tkinter
                    self.icons[icon_name] = PhotoImage(file=icon_path)
                    logging.info(f"Ícone {icon_name} carregado com sucesso: {icon_path}")
                except Exception as e:
                    logging.warning(f"Erro ao carregar ícone {icon_name}: {e}")
                    self.icons[icon_name] = None
            else:
                logging.warning(f"Arquivo de ícone não encontrado: {icon_path}")
                self.icons[icon_name] = None
    
    def get_icon(self, icon_type):
        """
        Retorna o ícone solicitado.
        
        Args:
            icon_type (str): Tipo do ícone ('program_top', 'taskbar', 'desktop', 'installer')
            
        Returns:
            PhotoImage ou None: O ícone carregado ou None se não encontrado
        """
        return self.icons.get(icon_type)
    
    def get_icon_path(self, icon_type):
        """
        Retorna o caminho do arquivo do ícone.
        
        Args:
            icon_type (str): Tipo do ícone ('program_top', 'taskbar', 'desktop', 'installer')
            
        Returns:
            str ou None: Caminho do arquivo ou None se não encontrado
        """
        icon_files = {
            'program_top': 'program_top_icon.png',
            'taskbar': 'taskbar_icon.png', 
            'desktop': 'desktop_icon.png',
            'installer': 'installer_icon.png'
        }
        
        if icon_type in icon_files:
            icon_path = os.path.join(self.base_path, icon_files[icon_type])
            if os.path.exists(icon_path):
                return icon_path
        return None
    
    def set_window_icon(self, window, icon_type='program_top'):
        """
        Define o ícone de uma janela Tkinter.
        
        Args:
            window: Janela Tkinter (tk.Tk ou tk.Toplevel)
            icon_type (str): Tipo do ícone a ser usado
        """
        icon = self.get_icon(icon_type)
        if icon:
            try:
                window.iconphoto(True, icon)
                logging.info(f"Ícone {icon_type} definido para a janela")
            except Exception as e:
                logging.warning(f"Erro ao definir ícone da janela: {e}")
        else:
            logging.warning(f"Ícone {icon_type} não disponível para a janela")
    
    def get_available_icons(self):
        """
        Retorna lista de ícones disponíveis.
        
        Returns:
            list: Lista com os nomes dos ícones carregados com sucesso
        """
        return [name for name, icon in self.icons.items() if icon is not None]
    
    def reload_icons(self):
        """Recarrega todos os ícones."""
        self.icons.clear()
        self._load_icons()
        logging.info("Ícones recarregados")

# Instância global do gerenciador de ícones
_icon_manager = None

def get_icon_manager():
    """
    Retorna a instância global do gerenciador de ícones.
    
    Returns:
        IconManager: Instância do gerenciador de ícones
    """
    global _icon_manager
    if _icon_manager is None:
        _icon_manager = IconManager()
    return _icon_manager

