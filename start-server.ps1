# 會員註冊系統 - 本地服務器啟動腳本
# 使用方法：在 PowerShell 執行 .\start-server.ps1

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   🚀 會員註冊系統 - 本地服務器      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📡 正在啟動本地 HTTP 服務器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ 服務器啟動後，請訪問以下網址：" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🔗 註冊頁面：" -ForegroundColor White
Write-Host "      http://localhost:8000/web-register.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🔗 登入頁面：" -ForegroundColor White
Write-Host "      http://localhost:8000/login.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "   🔗 首頁：" -ForegroundColor White
Write-Host "      http://localhost:8000/index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  注意事項：" -ForegroundColor Yellow
Write-Host "   - 請勿關閉此視窗" -ForegroundColor Gray
Write-Host "   - 按 Ctrl+C 可停止服務器" -ForegroundColor Gray
Write-Host "   - 確保沒有其他程式佔用 8000 埠" -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

try {
    # 檢查 Python 是否安裝
    $pythonVersion = python --version 2>&1
    Write-Host "✅ 檢測到 $pythonVersion" -ForegroundColor Green
    Write-Host ""
    
    # 啟動服務器
    python -m http.server 8000
}
catch {
    Write-Host ""
    Write-Host "❌ 錯誤：Python 未安裝或未加入 PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "解決方法：" -ForegroundColor Yellow
    Write-Host "1. 前往 https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "2. 下載並安裝 Python" -ForegroundColor White
    Write-Host "3. 安裝時勾選 'Add Python to PATH'" -ForegroundColor White
    Write-Host "4. 重新執行此檔案" -ForegroundColor White
    Write-Host ""
    Read-Host "按 Enter 鍵退出"
}

