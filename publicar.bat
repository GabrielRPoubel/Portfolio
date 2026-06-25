@echo off
chcp 65001 > nul
echo.
echo === Portfolio de Gabriel Poubel ===
echo.

echo [1/4] Processando fotos e atualizando index...
python gerar.py
if errorlevel 1 (
    echo Erro ao processar fotos. Verifique se o Python e o Pillow estao instalados.
    echo Execute: pip install Pillow
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando alteracoes...
git status --short
git add -u
git add fotos/thumbs/
git add fotos/*.jpg 2>nul

git diff --cached --quiet
if not errorlevel 1 (
    echo Nenhuma alteracao detectada. Site ja esta atualizado.
    pause
    exit /b 0
)

echo.
echo [3/4] Salvando alteracoes...
git commit -m "atualiza portfolio"

echo.
echo [4/4] Enviando para o GitHub...
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
echo Pronto! Site atualizado em instantes no Vercel.
echo.
pause
