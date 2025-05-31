@echo off
title Warframe Manager Server
color 0A
mode con: cols=80 lines=25

:: Configuración de rutas
SET NODE_PATH="C:\Program Files\nodejs\node.exe"
SET SERVER_PATH="%~dp0server.js"
SET LOG_PATH="%~dp0server.log"

:menu
cls
echo  ===============================
echo   WARFRAME MANAGER - MENU PRINCIPAL
echo  ===============================
echo.
echo  1. Iniciar Servidor (Modo Silencioso)
echo  2. Iniciar Servidor (Mostrar Consola)
echo  3. Detener Servidor
echo  4. Instalar como Servicio
echo  5. Salir
echo.
set /p choice="Seleccione una opcion [1-5]: "

if "%choice%"=="1" goto start_silent
if "%choice%"=="2" goto start_visible
if "%choice%"=="3" goto stop_server
if "%choice%"=="4" goto install_service
if "%choice%"=="5" exit

:start_silent
echo Iniciando servidor en modo silencioso...
start "Warframe Manager" /B %NODE_PATH% %SERVER_PATH% > %LOG_PATH% 2>&1
echo Servidor iniciado. Accede en http://localhost:3000
ping -n 5 127.0.0.1 > nul
goto menu

:start_visible
echo Iniciando servidor con consola visible...
start "Warframe Manager" %NODE_PATH% %SERVER_PATH%
goto menu

:stop_server
taskkill /IM node.exe /F > nul 2>&1
echo Servidor detenido.
ping -n 3 127.0.0.1 > nul
goto menu

:install_service
echo Instalando como servicio de Windows...
npm install -g node-windows
echo Creando servicio...
call node "%~dp0install-service.js"
echo Servicio instalado. Se iniciará automáticamente.
ping -n 3 127.0.0.1 > nul
goto menu