@echo off
chcp 65001 >nul
title Управление отгрузкой - Запуск
color 0A

echo ══════════════════════════════════════════
echo   Управление отгрузкой - Запуск приложения
echo ═══════════════════════════════════════════
echo.

:: Проверяем наличие Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ОШИБКА] Node.js не установлен!
    echo.
    echo Скачайте и установите Node.js с сайта:
    echo https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [OK] Node.js найден: 
node -v
echo.

:: Определяем локальный IP-адрес
echo [INFO] Определение IP-адреса...
set IP=127.0.0.1

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    goto :ip_found
)
:ip_found
:: Убираем пробелы
set IP=%IP: =%

echo [OK] Локальный IP: %IP%
echo.

:: Проверяем наличие node_modules
if not exist "node_modules\" (
    echo [INFO] Установка зависимостей...
    echo Это займет 1-2 минуты при первом запуске.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ОШИБКА] Не удалось установить зависимости!
        pause
        exit /b
    )
    echo.
    echo [OK] Зависимости установлены!
    echo.
)

:: Запускаем сервер
echo [INFO] Запуск сервера...
echo.
echo ═══════════════════════════════════════════
echo   Сервер запущен! Откройте в браузере:
echo.
echo   На этом компьютере:
echo   http://localhost:5173
echo.
echo   С телефона/планшета (в той же Wi-Fi):
echo   http://%IP%:5173
echo ═══════════════════════════════════════════
echo.
echo   Нажмите Ctrl+C для остановки сервера
echo.

call npm run dev -- --host

pause