@echo off
title Estructura del Proyecto
color 0A

cd tribunal_backend

echo ==========================
echo tribunal_backend
echo ==========================
dir

echo.
echo ==========================
echo tribunal
echo ==========================
cd tribunal
dir
cd ..

echo.
echo ==========================
echo config
echo ==========================
cd config
dir
cd ..

cd ..

echo.
echo ==========================
echo tribunal_frontend\src
echo ==========================
cd tribunal_frontend\src

tree /f

pause