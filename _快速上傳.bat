@echo off
chcp 65001 >nul
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🚀 快速上傳到 GitHub
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo ✅ 添加核心文件...
git add *.html
git add google-apps-script.js
git add assets/
git add README.md
git add .gitignore

echo.
echo ✅ 提交變更...
git commit -m "更新核心功能 - %date% %time%"

echo.
echo ✅ 推送到 GitHub...
git push origin main

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎉 上傳完成！
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 查看結果：https://github.com/sky770825/member-system
echo.
echo ⚠️ 說明文件不會上傳（已被 .gitignore 排除）
echo ✅ 只有核心功能會上傳
echo.

pause

