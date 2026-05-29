@echo off
chcp 65001 >nul
title TRUSTKAR - GitHub Upload
cd /d "C:\Users\ZC\Projects\trustkar"

set GIT=
if exist "C:\Program Files\Git\bin\git.exe" set "GIT=C:\Program Files\Git\bin\git.exe"
if exist "C:\Program Files (x86)\Git\bin\git.exe" set "GIT=C:\Program Files (x86)\Git\bin\git.exe"

if "%GIT%"=="" (
  echo Git install nahi: https://git-scm.com/download/win
  pause
  exit /b 1
)

if not exist ".git" (
  echo.
  echo Git abhi setup nahi. Pehle fresh-start.bat chalao ^(sirf ek bar^).
  echo.
  pause
  exit /b 1
)

echo.
echo TRUSTKAR - GitHub upload...
"%GIT%" add .

set /p MSG=Message (Enter = update): 
if "%MSG%"=="" set MSG=TRUSTKAR update

"%GIT%" commit -m "%MSG%"
if errorlevel 1 echo Koi nayi file nahi - push try karte hain...

"%GIT%" push origin main

if errorlevel 1 (
  echo Pull merge try...
  "%GIT%" pull origin main --no-edit
  "%GIT%" push origin main
)

if errorlevel 1 (
  echo ERROR - screenshot bhejo. Ya fresh-start.bat dubara ^(agar repo khali ho^).
) else (
  echo SUCCESS - Vercel 1-2 min mein update karega.
)
echo.
pause
