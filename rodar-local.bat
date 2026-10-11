@echo off
chcp 65001 > nul
echo.
echo === Portfolio local: http://localhost:8000/index.html ===
echo (nao abra por duplo clique: file:// bloqueia o fotos.json)
echo Feche esta janela ou Ctrl+C para parar.
echo.
start "" "http://localhost:8000/index.html"
python -m http.server 8000
