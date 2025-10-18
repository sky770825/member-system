@echo off
chcp 65001 >nul
color 0A
echo.
echo ╔════════════════════════════════════════╗
echo ║   🚀 會員註冊系統 - 本地服務器      ║
echo ╚════════════════════════════════════════╝
echo.
echo 📡 正在啟動本地 HTTP 服務器...
echo.
echo ✅ 服務器啟動後，請訪問以下網址：
echo.
echo    🔗 註冊頁面：
echo       http://localhost:8000/web-register.html
echo.
echo    🔗 登入頁面：
echo       http://localhost:8000/login.html
echo.
echo    🔗 首頁：
echo       http://localhost:8000/index.html
echo.
echo ⚠️  注意事項：
echo    - 請勿關閉此視窗
echo    - 按 Ctrl+C 可停止服務器
echo    - 確保沒有其他程式佔用 8000 埠
echo.
echo ════════════════════════════════════════
echo.

python -m http.server 8000

if errorlevel 1 (
    echo.
    echo ❌ 錯誤：Python 未安裝或未加入 PATH
    echo.
    echo 解決方法：
    echo 1. 前往 https://www.python.org/downloads/
    echo 2. 下載並安裝 Python
    echo 3. 安裝時勾選 "Add Python to PATH"
    echo 4. 重新執行此檔案
    echo.
    pause
)

