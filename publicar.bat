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
echo [2/4] Salvando alteracoes locais...
git add .
git commit -m "atualiza fotos"

echo.
echo [3/4] Sincronizando com o GitHub...
git pull origin main --rebase
if errorlevel 1 (
    echo Erro ao sincronizar. Verifique sua conexao.
    pause
    exit /b 1
)

echo.
echo [4/4] Enviando para o GitHub...
git push
if errorlevel 1 (
    echo Erro ao enviar para o GitHub.
    pause
    exit /b 1
)

echo.
echo Pronto! Site atualizado em instantes no Vercel.
echo.
pause
