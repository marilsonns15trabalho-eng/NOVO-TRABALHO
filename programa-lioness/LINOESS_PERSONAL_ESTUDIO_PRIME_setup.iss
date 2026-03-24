; Script for Inno Setup
; LIONESS PERSONAL ESTUDIO - PRIME

[Setup]
AppName=Lioness Personal Estúdio PRIME
AppVersion=1.0
AppPublisher=Lioness PE
DefaultDirName=C:\LPE_PRIME
DefaultGroupName=Lioness Personal Estúdio PRIME
OutputBaseFilename=LPE_PRIME_Setup_v1.0
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; O ícone deve estar no mesmo diretório que o script ou caminho relativo correto
SetupIconFile=src\utils\installer_icon.ico

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copia todos os arquivos gerados pelo PyInstaller (assumindo modo diretório)
Source: "dist\LINOESS PERSONAL ESTUDIO - PRIME\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Incluir o banco de dados inicial se necessário
Source: "data\lpe_database.db"; DestDir: "{userappdata}\Lioness Personal Estudio\data"; Flags: onlyifdoesntexist

[Icons]
Name: "{group}\Lioness Personal Estúdio PRIME"; Filename: "{app}\main.exe"
Name: "{group}\{cm:UninstallProgram,Lioness Personal Estúdio PRIME}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Lioness Personal Estúdio PRIME"; Filename: "{app}\main.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\main.exe"; Description: "{cm:LaunchProgram,Lioness Personal Estúdio PRIME}"; Flags: nowait postinstall skipifsilent
