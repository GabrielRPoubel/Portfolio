@echo off
chcp 65001 > nul
echo.
echo === Portfolio de Gabriel Poubel ===
echo.

echo [1/5] Processando fotos e atualizando fotos.js...
python gerar.py
if errorlevel 1 (
    echo Erro ao processar fotos. Verifique se o Python e o Pillow estao instalados.
    pause
    exit /b 1
)

echo.
echo [2/5] Instalando dependencias (se necessario)...
call npm install --silent
if errorlevel 1 (
    echo Erro ao instalar dependencias.
    pause
    exit /b 1
)

echo.
echo [3/5] Gerando build em dist/...
call npm run build
if errorlevel 1 (
    echo Erro no build.
    pause
    exit /b 1
)

echo.
echo [4/5] Verificando alteracoes...
git add -A
git diff --cached --quiet
if not errorlevel 1 (
    echo Nenhuma alteracao detectada. Site ja esta atualizado.
    pause
    exit /b 0
)

echo.
echo [5/5] Salvando e enviando para o GitHub...
git commit -m "atualiza portfolio"
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
echo.
pause
