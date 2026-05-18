@echo off
chcp 65001 > nul
echo.
echo === Portfolio de Gabriel Poubel (Versao Otimizada) ===
echo.

echo [1/4] Lendo fotos e atualizando JavaScript...
python gerar.py
if errorlevel 1 (
    echo Erro ao gerar lista de fotos. Verifique se o Python esta instalado.
    pause
    exit /b 1
)

echo.
echo [2/4] Salvando alteracoes locais...
git add .
git commit -m "atualiza fotos e codigo otimizado"

echo.
echo [3/4] Sincronizando com o GitHub...
git pull origin main --rebase
if errorlevel 1 (
    echo Erro ao sincronizar com o GitHub. Verifique sua conexao.
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
echo Pronto! Site atualizado. As mudancas estarao no ar no GitHub Pages/Vercel em instantes.
echo.
pause
