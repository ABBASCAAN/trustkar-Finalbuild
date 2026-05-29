@echo off
chcp 65001 >nul
title TRUSTKAR - NAYA START (Fresh)
cd /d "C:\Users\ZC\Projects\trustkar"

set GIT=
if exist "C:\Program Files\Git\bin\git.exe" set "GIT=C:\Program Files\Git\bin\git.exe"
if exist "C:\Program Files (x86)\Git\bin\git.exe" set "GIT=C:\Program Files (x86)\Git\bin\git.exe"

if "%GIT%"=="" (
  echo Git install nahi mila. https://git-scm.com/download/win
  pause
  exit /b 1
)

echo.
echo ==========================================
echo   TRUSTKAR - PURANA GIT HATA KAR NAYA START
echo ==========================================
echo.
echo ZAROORI: Pehle GitHub par purana repo DELETE karo
echo aur NAYA khali repo "trustkar" banao.
echo Details: START_FRESH.md file kholo
echo.
set /p OK=Kya aap ne naya khali repo bana liya? (Y/N): 
if /i not "%OK%"=="Y" (
  echo Pehle START_FRESH.md PART 1 karo, phir dubara chalao.
  pause
  exit /b 0
)

echo.
echo Purana .git folder hata rahe hain...
if exist ".git" rmdir /s /q ".git"

echo Naya Git shuru...
"%GIT%" init
"%GIT%" branch -M main
"%GIT%" add .
"%GIT%" commit -m "TRUSTKAR - clean fresh start"

"%GIT%" remote remove origin 2>nul
"%GIT%" remote add origin https://github.com/ABBASCAAN/trustkar.git

echo.
echo GitHub par upload... login ho sakta hai
"%GIT%" push -u origin main --force

if errorlevel 1 (
  echo.
  echo [ERROR] Push fail.
  echo Check: GitHub par repo khali hai? Naam trustkar hai?
  echo Username: ABBASCAAN
  echo.
) else (
  echo.
  echo ==========================================
  echo   SUCCESS! GitHub par sab upload ho gaya.
  echo ==========================================
  echo Ab Vercel par jao - repo trustkar deploy karo.
  echo Roz ke liye: upload-github.bat use karo
  echo.
)

pause
