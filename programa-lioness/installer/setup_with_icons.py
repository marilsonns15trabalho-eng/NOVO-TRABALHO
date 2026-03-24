"""
Script de instalação/empacotamento para o Lioness Personal Estúdio - PRIME
com suporte completo a ícones.

Este script utiliza cx_Freeze ou PyInstaller para criar um executável
que inclui todos os ícones necessários.
"""

import os
import sys
import shutil
from pathlib import Path

def create_desktop_shortcut(exe_path, icon_path=None):
    """
    Cria um atalho na área de trabalho (Windows).
    
    Args:
        exe_path (str): Caminho para o executável
        icon_path (str): Caminho para o ícone do atalho
    """
    try:
        import winshell
        from win32com.client import Dispatch
        
        desktop = winshell.desktop()
        path = os.path.join(desktop, "Lioness Personal Estúdio - PRIME.lnk")
        target = exe_path
        wDir = os.path.dirname(exe_path)
        
        shell = Dispatch('WScript.Shell')
        shortcut = shell.CreateShortCut(path)
        shortcut.Targetpath = target
        shortcut.WorkingDirectory = wDir
        if icon_path and os.path.exists(icon_path):
            shortcut.IconLocation = icon_path
        shortcut.save()
        
        print(f"Atalho criado na área de trabalho: {path}")
        
    except ImportError:
        print("Aviso: Módulos winshell/pywin32 não disponíveis. Atalho não criado.")
    except Exception as e:
        print(f"Erro ao criar atalho: {e}")

def setup_pyinstaller():
    """
    Configura e executa o PyInstaller com suporte a ícones.
    """
    # Determinar caminhos
    base_dir = Path(__file__).parent.parent
    src_dir = base_dir / "src"
    main_script = src_dir / "main_with_icons.py"
    icon_path = base_dir / "program_top_icon.png"
    
    # Comando PyInstaller
    cmd_parts = [
        "pyinstaller",
        "--onefile",
        "--windowed",
        "--name=LionessPersonalEstudio-PRIME",
        f"--add-data={src_dir};src",
        f"--add-data={base_dir / '*.png'};.",
    ]
    
    # Adicionar ícone se existir
    if icon_path.exists():
        cmd_parts.append(f"--icon={icon_path}")
    
    cmd_parts.append(str(main_script))
    
    # Executar PyInstaller
    cmd = " ".join(cmd_parts)
    print(f"Executando: {cmd}")
    os.system(cmd)
    
    # Criar atalho na área de trabalho
    exe_path = base_dir / "dist" / "LionessPersonalEstudio-PRIME.exe"
    desktop_icon_path = base_dir / "desktop_icon.png"
    
    if exe_path.exists():
        create_desktop_shortcut(str(exe_path), str(desktop_icon_path) if desktop_icon_path.exists() else None)

def setup_cx_freeze():
    """
    Configura e executa o cx_Freeze com suporte a ícones.
    """
    try:
        from cx_Freeze import setup, Executable
    except ImportError:
        print("cx_Freeze não está instalado. Use: pip install cx_Freeze")
        return
    
    # Determinar caminhos
    base_dir = Path(__file__).parent.parent
    src_dir = base_dir / "src"
    main_script = src_dir / "main_with_icons.py"
    icon_path = base_dir / "program_top_icon.png"
    
    # Incluir arquivos adicionais
    include_files = []
    
    # Adicionar ícones
    for icon_file in ["program_top_icon.png", "taskbar_icon.png", "desktop_icon.png", "installer_icon.png"]:
        icon_full_path = base_dir / icon_file
        if icon_full_path.exists():
            include_files.append((str(icon_full_path), icon_file))
    
    # Adicionar diretório src
    include_files.append((str(src_dir), "src"))
    
    # Configurações do build
    build_exe_options = {
        "packages": ["tkinter", "sqlite3", "logging"],
        "include_files": include_files,
        "excludes": ["test", "unittest"],
    }
    
    # Configurar executável
    exe_options = {
        "script": str(main_script),
        "base": "Win32GUI" if sys.platform == "win32" else None,
        "target_name": "LionessPersonalEstudio-PRIME",
    }
    
    # Adicionar ícone se existir
    if icon_path.exists():
        exe_options["icon"] = str(icon_path)
    
    executable = Executable(**exe_options)
    
    # Executar setup
    setup(
        name="Lioness Personal Estúdio - PRIME",
        version="1.0.0",
        description="Sistema de Gestão para Personal Training",
        options={"build_exe": build_exe_options},
        executables=[executable]
    )

def main():
    """Função principal do instalador."""
    print("=== Lioness Personal Estúdio - PRIME ===")
    print("Configurador de Instalação com Ícones")
    print()
    
    # Verificar se os ícones existem
    base_dir = Path(__file__).parent.parent
    icon_files = ["program_top_icon.png", "taskbar_icon.png", "desktop_icon.png", "installer_icon.png"]
    
    print("Verificando ícones:")
    for icon_file in icon_files:
        icon_path = base_dir / icon_file
        status = "✓ Encontrado" if icon_path.exists() else "✗ Não encontrado"
        print(f"  {icon_file}: {status}")
    
    print()
    print("Escolha o método de empacotamento:")
    print("1. PyInstaller (recomendado)")
    print("2. cx_Freeze")
    print("3. Sair")
    
    choice = input("Digite sua escolha (1-3): ").strip()
    
    if choice == "1":
        setup_pyinstaller()
    elif choice == "2":
        setup_cx_freeze()
    elif choice == "3":
        print("Saindo...")
    else:
        print("Opção inválida!")

if __name__ == "__main__":
    main()

