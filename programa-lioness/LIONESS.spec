# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['src\\main.py'],
    pathex=[],
    binaries=[],
    datas=[('src\\models', 'models'), ('src\\gui', 'gui'), ('src\\data', 'data'), ('src\\financial', 'financial'), ('src\\common', 'common'), ('src\\modules', 'modules'), ('src\\integrations', 'integrations'), ('src\\ui', 'ui'), ('src\\utils', 'utils'), ('config', 'config'), ('database', 'database'), ('data', 'data')],
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
    a.binaries,
    a.datas,
    [],
    name='LIONESS',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['src\\utils\\program_top_icon.png'],
)
