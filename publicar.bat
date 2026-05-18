@echo off
chcp 65001 > nul
echo.
echo === Portfolio de Gabriel Poubel ===
echo.

echo [1/3] Contando fotos na pasta fotos\...
python gerar.py
if errorlevel 1 (
    echo Erro ao gerar lista de fotos. Verifique se o Python esta instalado.
    pause
    exit /b 1
)

echo.
echo [2/3] Enviando para o GitHub...
git add .
git commit -m "atualiza fotos"
git push
if errorlevel 1 (
    echo Erro ao enviar para o GitHub.
    pause
    exit /b 1
)

echo.
echo [3/3] Pronto! Site atualizado em instantes no Vercel.
echo.
pause
