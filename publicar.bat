@echo off
chcp 65001 > nul
echo.
echo === Portfolio de Gabriel Poubel ===
echo.

echo [1/5] Processando fotos e atualizando index...
python gerar.py
if errorlevel 1 (
    echo Erro ao processar fotos. Verifique se o Python e o Pillow estao instalados: pip install Pillow
    pause
    exit /b 1
)

echo.
echo [2/5] Gerando build em dist/...
call node js/build.js
if errorlevel 1 (
    echo Erro no build.
    pause
    exit /b 1
)

echo.
echo [3/5] Verificando alteracoes...
git rm -r --cached node_modules >nul 2>&1
git status --short
git add index.html fotos.json fotos/thumbs/ dist/index.html css/ js/ vercel.json package.json gerar.py publicar.bat favicon.png .gitignore
git diff --cached --quiet
if not errorlevel 1 (
    echo Nenhuma alteracao detectada. Site ja esta atualizado.
    pause
    exit /b 0
)

echo.
echo [4/5] Salvando alteracoes...
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set HOJE=%%i
git commit -m "atualiza portfolio %HOJE%"

echo.
echo [5/5] Enviando para o GitHub...
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
echo Pronto! Vercel atualiza em instantes.
echo Lembrete: node_modules/ nao vai mais para o git (.gitignore).
echo.
pause
