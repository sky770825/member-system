@echo off
REM 會員系統專案生成工具 (Windows 版本)
REM 用法: create-project.bat <產業類型> <專案名稱> <公司名稱>
REM 範例: create-project.bat restaurant my-restaurant "美味餐廳"

setlocal enabledelayedexpansion

set INDUSTRY=%1
set PROJECT_NAME=%2
set COMPANY_NAME=%3

if "%INDUSTRY%"=="" (
    echo ❌ 使用方式: create-project.bat ^<產業類型^> ^<專案名稱^> ^<公司名稱^>
    echo 產業類型: restaurant, beauty, fitness, retail, coffee, general
    echo 範例: create-project.bat restaurant my-restaurant "美味餐廳"
    exit /b 1
)

if "%PROJECT_NAME%"=="" (
    echo ❌ 請提供專案名稱
    exit /b 1
)

if "%COMPANY_NAME%"=="" (
    echo ❌ 請提供公司名稱
    exit /b 1
)

echo 🚀 開始創建專案: %PROJECT_NAME%
echo 📁 產業類型: %INDUSTRY%
echo 🏢 公司名稱: %COMPANY_NAME%
echo.

REM 創建專案資料夾
echo ✅ 步驟 1/5: 創建資料夾結構...
mkdir "..\%PROJECT_NAME%"
cd "..\%PROJECT_NAME%"
mkdir assets
mkdir docs

echo ✅ 步驟 2/5: 複製核心文件...
REM 複製 HTML 文件
copy "..\會員註冊系統\index.html" . >nul
copy "..\會員註冊系統\register.html" . >nul
copy "..\會員註冊系統\profile.html" . >nul
copy "..\會員註冊系統\transfer.html" . >nul
copy "..\會員註冊系統\edit.html" . >nul
copy "..\會員註冊系統\history.html" . >nul

REM 複製樣式
copy "..\會員註冊系統\assets\style.css" assets\ >nul

REM 複製 Google Apps Script
copy "..\會員註冊系統\google-apps-script.js" . >nul

echo ✅ 步驟 3/5: 創建配置文件...
REM 根據產業類型複製配置
if exist "..\會員註冊系統\templates\%INDUSTRY%-config.js" (
    copy "..\會員註冊系統\templates\%INDUSTRY%-config.js" config.js >nul
    echo    使用 %INDUSTRY% 產業模板
) else (
    copy "..\會員註冊系統\config.template.js" config.js >nul
    echo    使用通用模板
)

echo ✅ 步驟 4/5: 創建說明文件...
(
echo # %COMPANY_NAME% 會員系統
echo.
echo 基於通用會員系統模板建立
echo.
echo ## 🚀 快速開始
echo.
echo 1. 編輯 `config.js` 填入您的設定
echo 2. 部署 `google-apps-script.js` 到 Google Apps Script
echo 3. 設定 LINE LIFF
echo 4. 部署到 GitHub Pages
echo.
echo ## 📁 專案結構
echo.
echo - `index.html` - 首頁
echo - `register.html` - 註冊頁面
echo - `profile.html` - 會員中心
echo - `transfer.html` - 轉點頁面
echo - `config.js` - 配置文件 ⭐
echo - `google-apps-script.js` - 後端 API
echo.
echo ## 📞 技術支援
echo.
echo 如有問題請聯繫系統開發商
) > README.md

(
echo # 本地開發
echo .DS_Store
echo Thumbs.db
echo *.log
echo.
echo # 敏感資訊
echo config.local.js
echo .env
echo.
echo # 編輯器
echo .vscode/
echo .idea/
echo *.swp
) > .gitignore

echo ✅ 步驟 5/5: 初始化 Git...
git init >nul 2>&1
git add . >nul 2>&1
git commit -m "初始化 %COMPANY_NAME% 會員系統" >nul 2>&1

echo.
echo 🎉 專案創建完成！
echo.
echo 📁 專案位置: %CD%
echo.
echo 📋 接下來的步驟:
echo 1. 編輯 config.js 填入您的設定
echo 2. 將 Logo 放到 assets\logo.png
echo 3. 設定 Google Apps Script
echo 4. 設定 LINE LIFF
echo 5. 推送到 GitHub:
echo    git remote add origin https://github.com/您的帳號/%PROJECT_NAME%.git
echo    git push -u origin main
echo.
echo ✨ 祝您使用愉快！

endlocal

