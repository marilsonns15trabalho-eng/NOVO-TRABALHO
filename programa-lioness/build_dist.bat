@echo off
title Gerando DIST para Inno Setup
echo ==========================================
echo LIONESS PERSONAL ESTUDIO - COMPILACAO
echo ==========================================

REM Apaga pastas antigas
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

REM Executa o PyInstaller
pyinstaller ^
    --noconfirm ^
    --clean ^
    --name "LINOESS PERSONAL ESTUDIO - PRIME" ^
    --icon "src/utils/program_top_icon.ico" ^
    --add-data "src;src" ^
    --add-data "config;config" ^
    --add-data "data;data" ^
    --add-data "database;database" ^
    --add-data "logs;logs" ^
    --add-data "exports;exports" ^
    --add-data "impressoes;impressoes" ^
    --add-data "attachments;attachments" ^
    --add-data "backups;backups" ^
    --add-data "installer;installer" ^
    --add-data "tools;tools" ^
    --add-data "desktop_icon.png;." ^
    --add-data "installer_icon.ico;." ^
    --add-data "installer_icon.png;." ^
    --add-data "installer_icon.png.ico;." ^
    --add-data "program_top_icon.ico;." ^
    --add-data "program_top_icon.png;." ^
    --add-data "taskbar_icon.ico;." ^
    --add-data "taskbar_icon.png;." ^
    --add-data "config.json;." ^
    main.py

echo.
echo ==========================================
echo COMPILACAO FINALIZADA
echo Pasta gerada: dist\LINOESS PERSONAL ESTUDIO - PRIME
echo ==========================================
pause