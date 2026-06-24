@echo off
chcp 65001 > nul
echo.
echo === Portfolio de Gabriel Poubel ===
echo.

echo [1/6] Processando fotos e atualizando index...
python gerar.py
if errorlevel 1 (
    echo Erro ao processar fotos. Verifique se o Python e o Pillow estao instalados.
    pause
    exit /b 1
)

echo.
echo [2/6] Instalando ferramentas de build (se necessario)...
call npm list javascript-obfuscator --prefix . >nul 2>&1
if errorlevel 1 (
    call npm install javascript-obfuscator --save-dev --silent
    if errorlevel 1 (
        echo Erro ao instalar javascript-obfuscator.
        pause
        exit /b 1
    )
)

echo.
echo [3/6] Gerando build ofuscado em dist/...
call node js/build.js
if errorlevel 1 (
    echo Erro no build.
    pause
    exit /b 1
)

echo.
echo [4/6] Verificando alteracoes...
git status --short
git add -u
git add fotos/thumbs/
git add fotos/*.jpg 2>nul
git add dist/index.html

git diff --cached --quiet
if not errorlevel 1 (
    echo Nenhuma alteracao detectada. Site ja esta atualizado.
    pause
    exit /b 0
)

echo.
echo [5/6] Salvando alteracoes...
git commit -m "atualiza portfolio"

echo.
echo [6/6] Enviando para o GitHub...
git fetch origin
git rebase origin/main
if errorlevel 1 (
    echo Erro ao sincronizar. Execute: git rebase --abort
    pause
    exit /b 1
)
git push origin main
if errorlevel 1 (
    echo Erro ao enviar. Tente: git push origin main
    pause
    exit /b 1
)

echo.
echo Pronto! Build ofuscado enviado. Vercel atualiza em instantes.
echo.
pause
