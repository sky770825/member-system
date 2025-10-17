@echo off
chcp 65001 >nul
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📦 更新「核心文件」資料夾
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo ✅ 步驟 1/4: 清空核心文件資料夾...
if exist "核心文件\*.html" del /Q "核心文件\*.html"
if exist "核心文件\*.js" del /Q "核心文件\*.js"
if exist "核心文件\*.md" del /Q "核心文件\*.md"
if exist "核心文件\assets\*.*" del /Q "核心文件\assets\*.*"

echo ✅ 步驟 2/4: 複製 HTML 文件...
copy /Y index.html "核心文件\" >nul
copy /Y register.html "核心文件\" >nul
copy /Y profile.html "核心文件\" >nul
copy /Y transfer.html "核心文件\" >nul
copy /Y edit.html "核心文件\" >nul
copy /Y history.html "核心文件\" >nul
copy /Y admin.html "核心文件\" >nul

echo ✅ 步驟 3/4: 複製後端和樣式...
copy /Y google-apps-script.js "核心文件\" >nul
if not exist "核心文件\assets" mkdir "核心文件\assets"
copy /Y "assets\style.css" "核心文件\assets\" >nul

echo ✅ 步驟 4/4: 複製配置文件...
copy /Y README.md "核心文件\" >nul
copy /Y .gitignore "核心文件\" >nul

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎉 核心文件更新完成！
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📁 資料夾位置: %CD%\核心文件
echo.
echo 📋 已複製文件：
echo    ✅ 7 個 HTML 頁面
echo    ✅ google-apps-script.js
echo    ✅ assets/style.css
echo    ✅ README.md
echo    ✅ .gitignore
echo.
echo 🚀 接下來可以：
echo.
echo    方式 A - 直接在核心文件資料夾上傳：
echo    ───────────────────────────────
echo    cd 核心文件
echo    git init
echo    git add .
echo    git commit -m "核心文件"
echo    git remote add origin https://github.com/sky770825/member-system.git
echo    git push -u origin main --force
echo.
echo    方式 B - 主資料夾選擇性上傳：
echo    ───────────────────────────────
echo    git add *.html google-apps-script.js assets/ README.md .gitignore
echo    git commit -m "更新核心功能"
echo    git push
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pause

