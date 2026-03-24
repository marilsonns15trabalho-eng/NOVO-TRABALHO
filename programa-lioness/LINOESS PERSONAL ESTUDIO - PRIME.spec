# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[('src', 'src'), ('config', 'config'), ('data', 'data'), ('database', 'database'), ('logs', 'logs'), ('exports', 'exports'), ('impressoes', 'impressoes'), ('attachments', 'attachments'), ('backups', 'backups'), ('installer', 'installer'), ('tools', 'tools'), ('desktop_icon.png', '.'), ('installer_icon.ico', '.'), ('installer_icon.png', '.'), ('installer_icon.png.ico', '.'), ('program_top_icon.ico', '.'), ('program_top_icon.png', '.'), ('taskbar_icon.png.ico', '.'), ('src/utils/desktop_icon.png', '.'), ('src/utils/installer_icon.png', '.'), ('src/utils/installer_icon.png.ico', '.'), ('src/utils/program_top_icon.png', '.'), ('src/utils/taskbar_icon.png', '.'), ('src/utils/taskbar_icon.ico', '.'), ('config.json', '.')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='LINOESS PERSONAL ESTUDIO - PRIME',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['src\\utils\\program_top_icon.ico'],
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='LINOESS PERSONAL ESTUDIO - PRIME',
)
