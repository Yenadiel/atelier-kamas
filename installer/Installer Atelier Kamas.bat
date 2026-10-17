@echo off
title Installation Atelier Kamas
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (echo. & echo L installation a echoue. Fais une capture de ce message et envoie-la. )
echo.
pause
