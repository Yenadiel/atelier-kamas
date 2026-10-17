# Installation d'Atelier Kamas (appli perso)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$src  = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = Join-Path $env:LOCALAPPDATA 'Programs\Atelier Kamas'
$url  = 'https://github.com/electron/electron/releases/download/v33.2.1/electron-v33.2.1-win32-x64.zip'
$sha  = 'C325A6D905C67107E166267813EA2151AE7FD316C0A88DE0081DB0B9851A9946'
$zip  = Join-Path $env:TEMP 'electron-v33.2.1-win32-x64.zip'

Write-Host ''
Write-Host '=== Atelier Kamas : installation ===' -ForegroundColor Yellow
Get-Process -Name 'Atelier Kamas' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 500

$ok = $false
if (Test-Path $zip) { $ok = ((Get-FileHash $zip -Algorithm SHA256).Hash -eq $sha) }
if (-not $ok) {
  Write-Host '1/3 Telechargement du moteur Electron depuis GitHub (115 Mo, 1 a 2 min)...'
  Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
  if ((Get-FileHash $zip -Algorithm SHA256).Hash -ne $sha) { Remove-Item $zip -Force; throw 'Fichier telecharge corrompu (empreinte SHA256 differente). Relance l installation.' }
} else { Write-Host '1/3 Moteur Electron deja telecharge.' }

Write-Host '2/3 Installation dans' $dest
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $dest -Force
Rename-Item (Join-Path $dest 'electron.exe') 'Atelier Kamas.exe'
Remove-Item (Join-Path $dest 'resources\default_app.asar') -Force -ErrorAction SilentlyContinue
Get-ChildItem (Join-Path $dest 'locales') | Where-Object { $_.Name -notin @('fr.pak','en-US.pak') } | Remove-Item -Force
Copy-Item (Join-Path $src 'app') (Join-Path $dest 'resources\app') -Recurse -Force

Write-Host '3/3 Creation des raccourcis (Bureau + menu Demarrer)'
$exe  = Join-Path $dest 'Atelier Kamas.exe'
$icon = Join-Path $dest 'resources\app\icon.ico'
$wsh  = New-Object -ComObject WScript.Shell
foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
  $lnk = $wsh.CreateShortcut((Join-Path $dir 'Atelier Kamas.lnk'))
  $lnk.TargetPath = $exe; $lnk.WorkingDirectory = $dest; $lnk.IconLocation = $icon
  $lnk.Description = 'Atelier Kamas - metiers et familier Dofus'
  $lnk.Save()
}

Write-Host ''
Write-Host 'Termine ! Atelier Kamas se lance. Raccourci sur ton Bureau.' -ForegroundColor Green
Write-Host 'Mode compact par-dessus Dofus : Ctrl + Maj + K'
Start-Process $exe
