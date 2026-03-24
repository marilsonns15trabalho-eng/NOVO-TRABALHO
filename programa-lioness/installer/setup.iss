[Setup]
AppName=LINOESS PERSONAL ESTUDIO PRIME
AppVersion=1.0
AppPublisher=LINOESS
AppPublisherURL=https://linoess.com
AppSupportURL=https://linoess.com
AppUpdatesURL=https://linoess.com
DefaultDirName={pf}\LINOESS PERSONAL ESTUDIO PRIME
DefaultGroupName=LINOESS PERSONAL ESTUDIO PRIME
AllowNoIcons=yes
LicenseFile=
OutputDir=C:\build\LPE\Output
OutputBaseFilename=LINOESS_PERSONAL_ESTUDIO_PRIME_Setup
SetupIconFile={app}\src\utils\installer_icon.png.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
UninstallDisplayIcon={app}\src\utils\program_top_icon.ico

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 0,6.1

[Files]
Source: "C:\build\LPE\LINOESS PERSONAL ESTUDIO - PRIME\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\LINOESS PERSONAL ESTUDIO PRIME"; Filename: "pythonw.exe"; Parameters: """{app}\main.py"""; WorkingDir: "{app}"; IconFilename: "{app}\src\utils\program_top_icon.ico"
Name: "{commondesktop}\LINOESS PERSONAL ESTUDIO PRIME"; Filename: "pythonw.exe"; Parameters: """{app}\main.py"""; WorkingDir: "{app}"; IconFilename: "{app}\src\utils\desktop_icon.png"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\LINOESS PERSONAL ESTUDIO PRIME"; Filename: "pythonw.exe"; Parameters: """{app}\main.py"""; WorkingDir: "{app}"; Tasks: quicklaunchicon

[Run]
Filename: "pythonw.exe"; Parameters: """{app}\main.py"""; WorkingDir: "{app}"; Description: "{cm:LaunchProgram,LINOESS PERSONAL ESTUDIO PRIME}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

